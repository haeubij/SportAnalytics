import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { VideoService } from '../../services/video.service';
import { Video } from '../../interfaces/video.interface';
import { HttpClient } from '@angular/common/http';
import { catchError, of, map } from 'rxjs';

/**
 * @author Janis Häubi
 * @version 1.0.0
 * @date 14.05.2024 (KW20)
 * @purpose Community-Komponente für öffentliche Videos
 * @description Zeigt alle öffentlichen Videos und behandelt Fehlerfälle.
 */
@Component({
  selector: 'app-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss'],
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe]
})
export class CommunityComponent implements OnInit {
  /**
   * Liste der öffentlichen Videos
   */
  publicVideos: Video[] = [];
  /**
   * Ladezustand
   */
  loading: boolean = false;
  /**
   * Fehlermeldung für das UI
   */
  errorMessage: string = '';

  /**
   * Konstruktor initialisiert VideoService und HttpClient
   * @param videoService Service für Videos
   * @param http HttpClient
   */
  constructor(
    private videoService: VideoService,
    private http: HttpClient
  ) {}

  /**
   * Initialisiert die Komponente und lädt öffentliche Videos
   */
  ngOnInit(): void {
    this.loadPublicVideos();
  }

  /**
   * Konvertiert Datumsstrings in Date-Objekte
   * @param videos Array von Videos
   * @returns Array von Videos mit Date-Objekten
   */
  private convertDates(videos: any[]): Video[] {
    return videos.map(video => ({
      ...video,
      uploadedAt: video.uploadedAt ? new Date(video.uploadedAt) : new Date()
    })) as Video[];
  }

  /**
   * Lädt alle öffentlichen Videos vom Server
   */
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