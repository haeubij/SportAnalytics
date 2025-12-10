import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { VideoService } from '../../services/video.service';
import { Video } from '../../interfaces/video.interface';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

/**
 * @author Janis Häubi
 * @version 1.0.0
 * @date 14.05.2024 (KW20)
 * @purpose Video-Analyse-Komponente
 * @description Ermöglicht Video-Upload, -Anzeige, -Löschung und Modalsteuerung für Analyse.
 */
@Component({
  selector: 'app-video-analysis',
  templateUrl: './video-analysis.component.html',
  styleUrls: ['./video-analysis.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe]
})
export class VideoAnalysisComponent implements OnInit {
  /**
   * Liste der Videos des Nutzers
   */
  videos: Video[] = [];
  /**
   * Ausgewählte Datei für Upload
   */
  selectedFile: File | null = null;
  /**
   * Fortschritt beim Upload
   */
  uploadProgress: number = 0;
  /**
   * Fehlermeldung für das UI
   */
  errorMessage: string = '';
  /**
   * Ladezustand
   */
  loading: boolean = false;
  /**
   * Zeigt das Upload-Modal an
   */
  showUploadModal: boolean = false;
  /**
   * Beschreibung des Videos
   */
  videoDescription: string = '';
  /**
   * Gibt an, ob das Video öffentlich ist
   */
  isPublic: boolean = false;

  /**
   * Konstruktor initialisiert Services und Router
   * @param videoService Service für Videos
   * @param authService Service für Authentifizierung
   * @param router Angular Router
   */
  constructor(
    private videoService: VideoService,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Initialisiert die Komponente und lädt Videos, wenn eingeloggt
   */
  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.loadVideos();
    }
  }

  /**
   * Lädt alle Videos des Nutzers
   */
  loadVideos(): void {
    this.loading = true;
    this.videoService.getVideos().subscribe({
      next: (videos) => {
        this.videos = videos;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Fehler beim Laden der Videos. Bitte erneut versuchen.';
        this.loading = false;
      }
    });
  }

  /**
   * Öffnet das Upload-Modal und setzt das Formular zurück
   */
  openUploadModal(): void {
    this.showUploadModal = true;
    this.resetUploadForm();
  }

  /**
   * Schließt das Upload-Modal und setzt das Formular zurück
   */
  closeUploadModal(): void {
    this.showUploadModal = false;
    this.resetUploadForm();
  }

  /**
   * Setzt das Upload-Formular zurück
   */
  resetUploadForm(): void {
    this.videoDescription = '';
    this.selectedFile = null;
    this.errorMessage = '';
    this.isPublic = false;
  }

  /**
   * Verarbeitet die Dateiauswahl für den Upload
   * @param event Datei-Input-Event
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  /**
   * Lädt das ausgewählte Video hoch
   */
  uploadVideo(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Bitte wählen Sie zuerst eine Videodatei aus.';
      return;
    }
    const formData = new FormData();
    formData.append('video', this.selectedFile);
    if (this.videoDescription.trim()) {
      formData.append('description', this.videoDescription.trim());
    }
    formData.append('isPublic', this.isPublic.toString());
    this.loading = true;
    this.videoService.uploadVideo(formData).subscribe({
      next: () => {
        this.loadVideos();
        this.closeUploadModal();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Fehler beim Hochladen des Videos. Bitte erneut versuchen.';
        this.loading = false;
      }
    });
  }

  /**
   * Löscht ein Video nach Bestätigung
   * @param videoId ID des zu löschenden Videos
   */
  deleteVideo(videoId: string): void {
    if (confirm('Möchten Sie dieses Video wirklich löschen?')) {
      this.videoService.deleteVideo(videoId).subscribe({
        next: () => {
          this.loadVideos();
        },
        error: () => {
          this.errorMessage = 'Fehler beim Löschen des Videos. Bitte erneut versuchen.';
        }
      });
    }
  }
} 