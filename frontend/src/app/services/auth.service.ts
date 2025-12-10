import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, tap, map } from 'rxjs';
import { User } from '../interfaces/user.interface';
import { jwtDecode } from 'jwt-decode';

/**
 * @author Manuel Affolter
 * @version 1.0.0
 * @date 14.05.2024 (KW20)
 * @purpose Service für Authentifizierung und Benutzerverwaltung
 * @description Stellt Methoden für Login, Registrierung, Token-Management und Admin-Status bereit.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * URL der Backend-API
   */
  private apiUrl = 'http://localhost:3000/api';
  /**
   * Zwischenspeicher für Admin-Status
   */
  private _cachedAdminStatus: boolean | null = null;

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
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-auth-token': token ? token : ''
    });
  }

  /**
   * Authentifiziert einen Benutzer mit Benutzernamen und Passwort
   * @param username Benutzername
   * @param password Passwort
   * @returns Observable mit Serverantwort
   */
  login(username: string, password: string): Observable<any> {
    this._cachedAdminStatus = null;
    return this.http.post(`${this.apiUrl}/auth/login`, { username, password });
  }

  /**
   * Registriert einen neuen Benutzer
   * @param user Benutzerobjekt
   * @returns Observable mit Serverantwort
   */
  register(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, user);
  }

  /**
   * Prüft, ob ein Benutzername bereits existiert
   * @param username Benutzername
   * @returns Observable mit Existenz-Status
   */
  checkUsername(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/check-username/${username}`);
  }

  /**
   * Speichert das Token im LocalStorage und cached Admin-Status
   * @param token JWT-Token
   */
  setToken(token: string): void {
    localStorage.setItem('token', token);
    this._cachedAdminStatus = null;
    // Admin-Status vorab aus Token decodieren
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this._cachedAdminStatus = decoded.user && decoded.user.role === 'admin';
        console.log('Pre-cached admin status:', this._cachedAdminStatus);
      } catch (error) {
        console.error('Fehler beim Decodieren des Tokens:', error);
        this._cachedAdminStatus = false;
      }
    }
  }

  /**
   * Holt das Token aus dem LocalStorage
   * @returns JWT-Token oder null
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Prüft, ob ein Benutzer eingeloggt ist
   * @returns true, wenn Token vorhanden
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Prüft den Admin-Status des aktuellen Benutzers (Server und Cache)
   * @returns Observable<boolean>
   */
  checkAdminStatus(): Observable<boolean> {
    if (this._cachedAdminStatus !== null && this.isLoggedIn()) {
      console.log('Verwende gecachten Admin-Status:', this._cachedAdminStatus);
      return of(this._cachedAdminStatus);
    }
    if (!this.isLoggedIn()) {
      this._cachedAdminStatus = false;
      return of(false);
    }
    return this.http.get<{isAdmin: boolean}>(`${this.apiUrl}/auth/check-admin`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        this._cachedAdminStatus = response.isAdmin;
      }),
      map(response => response.isAdmin),
      catchError(error => {
        this._cachedAdminStatus = false;
        return of(false);
      })
    );
  }

  /**
   * Prüft lokal, ob der aktuelle Benutzer Admin ist
   * @returns true, wenn Admin
   */
  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const decoded: any = jwtDecode(token);
      return decoded.user && decoded.user.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  /**
   * Holt aktuelle Benutzerdaten aus dem Token
   * @returns Benutzerobjekt oder null
   */
  getCurrentUser(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      return decoded.user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Erstellt oder aktualisiert einen Admin-Benutzer
   * @returns Observable mit Serverantwort
   */
  createAdmin(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/create-admin`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Loggt den Benutzer aus und entfernt das Token
   */
  logout(): void {
    localStorage.removeItem('token');
    this._cachedAdminStatus = null;
  }
} 