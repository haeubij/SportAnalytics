import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { VideoService } from '../../services/video.service';
import { Video } from '../../interfaces/video.interface';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-video-analysis',
  templateUrl: './video-analysis.component.html',
  styleUrls: ['./video-analysis.component.scss'],
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe]
})
export class VideoAnalysisComponent implements OnInit {
  videos: Video[] = [];
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private videoService: VideoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.loadVideos();
    }
  }

  // Load all videos
  loadVideos(): void {
    this.loading = true;
    this.videoService.getVideos().subscribe({
      next: (videos) => {
        this.videos = videos;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error loading videos. Please try again.';
        this.loading = false;
      }
    });
  }

  // Handle file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // Upload video
  uploadVideo(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a video file first.';
      return;
    }

    const formData = new FormData();
    formData.append('video', this.selectedFile);

    this.loading = true;
    this.videoService.uploadVideo(formData).subscribe({
      next: (response) => {
        this.loadVideos();
        this.selectedFile = null;
        this.uploadProgress = 0;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error uploading video. Please try again.';
        this.loading = false;
      }
    });
  }

  // Delete video
  deleteVideo(videoId: string): void {
    if (confirm('Are you sure you want to delete this video?')) {
      this.videoService.deleteVideo(videoId).subscribe({
        next: () => {
          this.loadVideos();
        },
        error: (error) => {
          this.errorMessage = 'Error deleting video. Please try again.';
        }
      });
    }
  }
} 