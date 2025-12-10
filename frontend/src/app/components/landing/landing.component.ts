import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Landing Page Component
 * Displays hero area, features, CTAs and routing depending on user auth state.
 */
@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class LandingComponent implements OnInit {

  isUserLoggedIn = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isUserLoggedIn = this.authService.isLoggedIn();
  }

  /**
   * Generic navigation helper
   */
  private navigate(path: string): void {
    this.router.navigate([path]);
  }

  /**
   * Navigation actions
   */
  goToVideoAnalysis(): void {
    const target = this.isUserLoggedIn ? '/video-analysis' : '/login';
    this.navigate(target);
  }

  goToLogin(): void {
    this.navigate('/login');
  }

  goToRegister(): void {
    this.navigate('/register');
  }

  goToCommunity(): void {
    this.navigate('/community');
  }
}