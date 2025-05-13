import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAdminUser: boolean = false;
  private routerSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Initial check for admin status
    this.checkAdminStatus();
    
    // Listen for route changes to update admin status
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkAdminStatus();
      });
  }
  
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // Check admin status from server when component initializes
  checkAdminStatus(): void {
    if (this.authService.isLoggedIn()) {
      // First use the fast local check
      const localAdminCheck = this.authService.isAdmin();
      this.isAdminUser = localAdminCheck;
      
      // Then verify with the server
      this.authService.checkAdminStatus().subscribe(isAdmin => {
        console.log('Admin status from server:', isAdmin);
        this.isAdminUser = isAdmin;
      });
    } else {
      this.isAdminUser = false;
    }
  }

  // Navigate to video analysis page
  goToVideoAnalysis(): void {
    this.router.navigate(['/video-analysis']);
  }

  // Navigate to community page
  goToCommunity(): void {
    this.router.navigate(['/community']);
  }

  // Navigate to landing page
  goToLanding(): void {
    this.router.navigate(['/landing']);
  }

  // Navigate to login page
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Navigate to admin page
  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  // Logout user
  logout(): void {
    this.authService.logout();
    this.isAdminUser = false;
    this.router.navigate(['/login']);
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.isAdminUser;
  }
} 