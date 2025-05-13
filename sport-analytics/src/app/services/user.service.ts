import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Hilfsfunktion für Authorization-Header
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-auth-token': token || ''
    });
  }

  // Alle Benutzer abrufen (nur für Admin)
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Benutzer nach ID abrufen
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Benutzer löschen (nur für Admin)
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Benutzerrolle ändern (nur für Admin)
  changeUserRole(userId: string, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/role`, { role }, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Benutzer sperren/entsperren (nur für Admin)
  toggleUserStatus(userId: string, isActive: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/status`, { isActive }, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Passwort zurücksetzen (nur für Admin)
  resetUserPassword(userId: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/password`, { newPassword }, { 
      headers: this.getAuthHeaders() 
    });
  }
} 