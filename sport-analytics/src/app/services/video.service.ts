import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Video } from '../interfaces/video.interface';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Hilfsfunktion, um das Token zu holen
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'x-auth-token': token ? token : ''
    });
  }

  // Get all videos
  getVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/videos`, { headers: this.getAuthHeaders() });
  }

  // Upload new video
  uploadVideo(videoData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/videos/upload`, videoData, { headers: this.getAuthHeaders() });
  }

  // Get video by ID
  getVideoById(id: string): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/videos/${id}`, { headers: this.getAuthHeaders() });
  }

  // Get videos by user ID
  getVideosByUser(userId: string): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/videos/user/${userId}`, { headers: this.getAuthHeaders() });
  }

  // Delete video
  deleteVideo(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/videos/${id}`, { headers: this.getAuthHeaders() });
  }
}