import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { VideoService } from '../../services/video.service';
import { Video } from '../../interfaces/video.interface';
import { HttpClient } from '@angular/common/http';
import { catchError, of, map } from 'rxjs';

@Component({
  selector: 'app-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss'],
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe]
})
export class CommunityComponent implements OnInit {
  publicVideos: Video[] = [];
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private videoService: VideoService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadPublicVideos();
  }

  // Hilfsfunktion zur Konvertierung von Datumsstrings in Date-Objekte
  private convertDates(videos: any[]): Video[] {
    return videos.map(video => ({
      ...video,
      uploadedAt: video.uploadedAt ? new Date(video.uploadedAt) : new Date()
    })) as Video[];
  }

  // Load all public videos - directly from main server
  loadPublicVideos(): void {
    this.loading = true;
    this.errorMessage = '';
    console.log('Loading public videos from main server...');
    
    // Benutze VideoService - es wurde bereits aktualisiert, um öffentliche Videos ohne Auth zu laden
    this.videoService.getPublicVideos()
      .pipe(
        // Konvertiere Datumswerte
        map(videos => this.convertDates(videos)),
        catchError(error => {
          console.error('Error accessing public videos:', error);
          this.errorMessage = 'Fehler beim Laden der Videos. Bitte versuchen Sie es später erneut.';
          return of([]);
        })
      )
      .subscribe({
        next: (videos) => {
          console.log(`Received ${videos.length} public videos`);
          this.publicVideos = videos;
          this.loading = false;
        },
        error: (finalError) => {
          console.error('Final error:', finalError);
          this.errorMessage = 'Fehler beim Laden der Videos.';
          this.loading = false;
        }
      });
  }
} 