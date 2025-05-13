import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user.interface';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api'; // Backend API URL

  constructor(private http: HttpClient) { }

  // Login user
  login(username: string, password: string): Observable<any> {
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
  }

  // Get user token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Check if current user is admin
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
    return this.http.post(`${this.apiUrl}/auth/create-admin`, {});
  }

  // Logout user
  logout(): void {
    localStorage.removeItem('token');
  }
} 