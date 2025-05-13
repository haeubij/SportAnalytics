import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class LandingComponent implements OnInit {
  isUserLoggedIn: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    this.isUserLoggedIn = this.authService.isLoggedIn();
  }

  // Navigate to video analysis page
  goToVideoAnalysis(): void {
    if (this.isUserLoggedIn) {
      this.router.navigate(['/video-analysis']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Navigate to login page
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Navigate to register page
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  // Navigate to community page
  goToCommunity(): void {
    this.router.navigate(['/community']);
  }
} 