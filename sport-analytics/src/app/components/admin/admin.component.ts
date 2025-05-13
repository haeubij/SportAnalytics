import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { VideoService } from '../../services/video.service';
import { Video } from '../../interfaces/video.interface';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AdminComponent implements OnInit {
  videos: Video[] = [];
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private videoService: VideoService
  ) { }

  ngOnInit(): void {
    // Check if user is admin
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadVideos();
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

  // Create admin user
  createAdmin(): void {
    this.authService.createAdmin().subscribe({
      next: (response) => {
        alert(response.message);
      },
      error: (error) => {
        this.errorMessage = 'Error creating admin user. Please try again.';
      }
    });
  }
} 