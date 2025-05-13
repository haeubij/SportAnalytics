import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HeaderComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  // Navigate to video analysis page
  goToVideoAnalysis(): void {
    this.router.navigate(['/video-analysis']);
  }

  // Navigate to landing page
  goToLanding(): void {
    this.router.navigate(['/landing']);
  }

  // Logout user
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
} 