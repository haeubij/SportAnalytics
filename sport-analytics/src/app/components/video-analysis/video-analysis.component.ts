import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { VideoService } from '../../services/video.service';
import { Video } from '../../interfaces/video.interface';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-video-analysis',
  templateUrl: './video-analysis.component.html',
  styleUrls: ['./video-analysis.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe]
})
export class VideoAnalysisComponent implements OnInit {
  videos: Video[] = [];
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  errorMessage: string = '';
  loading: boolean = false;
  showUploadModal: boolean = false;
  videoDescription: string = '';

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

  // Open upload modal
  openUploadModal(): void {
    this.showUploadModal = true;
    this.resetUploadForm();
  }

  // Close upload modal
  closeUploadModal(): void {
    this.showUploadModal = false;
    this.resetUploadForm();
  }

  // Reset upload form
  resetUploadForm(): void {
    this.videoDescription = '';
    this.selectedFile = null;
    this.errorMessage = '';
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
    
    if (this.videoDescription.trim()) {
      formData.append('description', this.videoDescription.trim());
    }

    console.log('FormData entries:');
    // Ausgabe aller FormData-Elemente (Debug)
    formData.forEach((value, key) => {
      if (key === 'video') {
        console.log(key, ':', 'File object');
      } else {
        console.log(key, ':', value);
      }
    });

    this.loading = true;
    this.videoService.uploadVideo(formData).subscribe({
      next: (response) => {
        console.log('Upload response:', response);
        this.loadVideos();
        this.closeUploadModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Upload error:', error);
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