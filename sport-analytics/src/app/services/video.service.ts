import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Video } from '../interfaces/video.interface';

/**
 * @author Janis Häubi
 * @version 1.0.0
 * @date 21.05.2024 (KW21)
 * @purpose Service für Video-Verwaltung und -Analyse
 * @description Stellt Methoden für Video-Upload, -Abfrage, -Löschung und öffentliche Videos bereit.
 */
@Injectable({
  providedIn: 'root'
})
export class VideoService {
  /**
   * URL der Backend-API
   */
  private apiUrl = 'http://localhost:3000/api';

  /**
   * Konstruktor initialisiert HttpClient
   * @param http Angular HttpClient
   */
  constructor(private http: HttpClient) { }

  /**
   * Erstellt HTTP-Header mit Authentifizierungs-Token
   * @returns HttpHeaders
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'x-auth-token': token ? token : ''
    });
  }

  /**
   * Holt alle Videos des aktuellen Nutzers (oder alle für Admin)
   * @returns Observable<Video[]>
   */
  getVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/videos`, { headers: this.getAuthHeaders() });
  }

  /**
   * Holt alle öffentlichen Videos (ohne Authentifizierung)
   * @returns Observable<Video[]>
   */
  getPublicVideos(): Observable<Video[]> {
    console.log('Requesting public videos directly from main server');
    // Explizit ohne Auth-Header anfragen
    return this.http.get<Video[]>(`${this.apiUrl}/videos/public`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  /**
   * Lädt ein neues Video hoch
   * @param videoData FormData mit Videodatei und Metadaten
   * @returns Observable<any>
   */
  uploadVideo(videoData: FormData): Observable<any> {
    // Verwende nur den Auth-Token, ohne Content-Type zu setzen (wird automatisch für FormData gesetzt)
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'x-auth-token': token ? token : ''
    });
    
    console.log('Uploading video with FormData:', videoData);
    
    return this.http.post(`${this.apiUrl}/videos/upload`, videoData, { 
      headers: headers 
    });
  }

  /**
   * Holt ein Video anhand der ID
   * @param id Video-ID
   * @returns Observable<Video>
   */
  getVideoById(id: string): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/videos/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Holt alle Videos eines bestimmten Nutzers
   * @param userId Benutzer-ID
   * @returns Observable<Video[]>
   */
  getVideosByUser(userId: string): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/videos/user/${userId}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Löscht ein Video anhand der ID
   * @param id Video-ID
   * @returns Observable<any>
   */
  deleteVideo(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/videos/${id}`, { headers: this.getAuthHeaders() });
  }
}