import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, tap, map } from 'rxjs';
import { User } from '../interfaces/user.interface';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api'; // Backend API URL
  private _cachedAdminStatus: boolean | null = null;

  constructor(private http: HttpClient) { }

  // Hilfsfunktion für Authorization-Header
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-auth-token': token ? token : ''
    });
  }

  // Login user
  login(username: string, password: string): Observable<any> {
    // Reset admin status cache on login
    this._cachedAdminStatus = null;
    return this.http.post(`${this.apiUrl}/auth/login`, { username, password });
  }

  // Register new user
  register(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, user);
  }

  // Check if username exists
  checkUsername(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/check-username/${username}`);
  }

  // Store user token in localStorage
  setToken(token: string): void {
    localStorage.setItem('token', token);
    // Reset admin status cache when token changes
    this._cachedAdminStatus = null;
    
    // Pre-cache admin status when token is set
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this._cachedAdminStatus = decoded.user && decoded.user.role === 'admin';
        console.log('Pre-cached admin status:', this._cachedAdminStatus);
      } catch (error) {
        console.error('Error decoding token during setToken:', error);
        this._cachedAdminStatus = false;
      }
    }
  }

  // Get user token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Check admin status from server
  checkAdminStatus(): Observable<boolean> {
    // If we have a cached value and we're logged in, use it
    if (this._cachedAdminStatus !== null && this.isLoggedIn()) {
      console.log('Using cached admin status:', this._cachedAdminStatus);
      return of(this._cachedAdminStatus);
    }

    if (!this.isLoggedIn()) {
      console.log('Not logged in, cannot be admin');
      this._cachedAdminStatus = false;
      return of(false);
    }

    return this.http.get<{isAdmin: boolean}>(`${this.apiUrl}/auth/check-admin`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('Server admin check response:', response);
        this._cachedAdminStatus = response.isAdmin;
      }),
      map(response => response.isAdmin),
      catchError(error => {
        console.error('Error checking admin status:', error);
        this._cachedAdminStatus = false;
        return of(false);
      })
    );
  }

  // Check if current user is admin
  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) {
      console.log('isAdmin: No token found');
      return false;
    }
    
    try {
      const decoded: any = jwtDecode(token);
      console.log('isAdmin check:', decoded);
      
      // Das Token muss ein user-Objekt mit einer role-Eigenschaft haben
      const isAdmin = decoded.user && decoded.user.role === 'admin';
      console.log('User is admin:', isAdmin);
      
      return isAdmin;
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  }

  // Get current user data from token
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

  // Create or update admin user
  createAdmin(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/create-admin`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Logout user
  logout(): void {
    localStorage.removeItem('token');
    this._cachedAdminStatus = null;
  }
} 