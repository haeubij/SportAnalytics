import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user.interface';

/**
 * @author Janis Häubi
 * @version 1.0.0
 * @date 21.05.2024 (KW21)
 * @purpose Service für Benutzerverwaltung (Admin)
 * @description Stellt Methoden für Benutzerabfrage, Rollenwechsel, Statusänderung und Passwort-Reset bereit.
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
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
      'Content-Type': 'application/json',
      'x-auth-token': token || ''
    });
  }

  /**
   * Holt alle Benutzer (nur für Admin)
   * @returns Observable<User[]>
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Holt einen Benutzer anhand der ID
   * @param userId Benutzer-ID
   * @returns Observable<User>
   */
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Löscht einen Benutzer (nur für Admin)
   * @param userId Benutzer-ID
   * @returns Observable<any>
   */
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Ändert die Rolle eines Benutzers (nur für Admin)
   * @param userId Benutzer-ID
   * @param role Neue Rolle ('user' oder 'admin')
   * @returns Observable<any>
   */
  changeUserRole(userId: string, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/role`, { role }, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Sperrt oder entsperrt einen Benutzer (nur für Admin)
   * @param userId Benutzer-ID
   * @param isActive Aktiv-Status
   * @returns Observable<any>
   */
  toggleUserStatus(userId: string, isActive: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/status`, { isActive }, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Setzt das Passwort eines Benutzers zurück (nur für Admin)
   * @param userId Benutzer-ID
   * @param newPassword Neues Passwort
   * @returns Observable<any>
   */
  resetUserPassword(userId: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/password`, { newPassword }, { 
      headers: this.getAuthHeaders() 
    });
  }
} 