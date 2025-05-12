import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'SportAnalytics Frontend';
  videos: any[] = [];
  selectedVideo: any = null;
  uploadProgress = 0;
  token: string | null = localStorage.getItem('token');
  username = '';
  password = '';
  loginError = '';
  registerUsername = '';
  registerPassword = '';
  registerError = '';

  constructor(private http: HttpClient) {
    if (this.token) this.loadVideos();
  }

  getAuthHeaders() {
    return { headers: new HttpHeaders({ Authorization: 'Bearer ' + this.token }) };
  }

  loadVideos() {
    this.http.get<any[]>('http://localhost:5000/api/videos', this.getAuthHeaders()).subscribe({
      next: (data) => this.videos = data,
      error: () => this.videos = []
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('video', file);
    this.http.post('http://localhost:5000/api/upload', formData, {
      ...this.getAuthHeaders(),
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: any) => {
        if (event.type === 1 && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === 4) {
          this.uploadProgress = 0;
          this.loadVideos();
        }
      },
      error: () => this.uploadProgress = 0
    });
  }

  selectVideo(video: any) {
    this.selectedVideo = video;
  }

  deleteVideo(video: any) {
    this.http.delete('http://localhost:5000/api/video/' + video._id, this.getAuthHeaders()).subscribe({
      next: () => {
        if (this.selectedVideo && this.selectedVideo._id === video._id) {
          this.selectedVideo = null;
        }
        this.loadVideos();
      }
    });
  }

  login() {
    this.http.post<{ token: string }>('http://localhost:5000/api/login', { username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.token = res.token;
        localStorage.setItem('token', this.token);
        this.loginError = '';
        this.loadVideos();
      },
      error: () => {
        this.loginError = 'Login fehlgeschlagen';
      }
    });
  }

  register() {
    this.http.post('http://localhost:5000/api/register', { username: this.registerUsername, password: this.registerPassword }).subscribe({
      next: () => {
        this.registerError = '';
        alert('Registrierung erfolgreich! Bitte logge dich ein.');
      },
      error: () => {
        this.registerError = 'Registrierung fehlgeschlagen';
      }
    });
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    this.videos = [];
    this.selectedVideo = null;
  }
}
