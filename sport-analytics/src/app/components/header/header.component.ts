import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * @author Janis Häubi
 * @version 1.0.0
 * @date 07.05.2024 (KW19)
 * @purpose Header-Komponente für Navigation und Statusanzeige
 * @description Stellt die Hauptnavigation, Admin-Status und Benutzeraktionen bereit.
 */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HeaderComponent implements OnInit, OnDestroy {
  /**
   * Gibt an, ob der aktuelle Nutzer Admin ist
   */
  isAdminUser: boolean = false;
  /**
   * Subscription für Router-Events
   */
  private routerSubscription: Subscription | null = null;

  /**
   * Konstruktor initialisiert Router und AuthService
   * @param router Angular Router
   * @param authService Service für Authentifizierung
   */
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Initialisiert die Komponente und prüft den Admin-Status
   */
  ngOnInit(): void {
    this.checkAdminStatus();
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkAdminStatus();
      });
  }
  
  /**
   * Bereinigt die Subscription beim Zerstören der Komponente
   */
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  /**
   * Prüft den Admin-Status des aktuellen Nutzers
   */
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

  /**
   * Navigiert zur Videoanalyse-Seite
   */
  goToVideoAnalysis(): void {
    this.router.navigate(['/video-analysis']);
  }

  /**
   * Navigiert zur Community-Seite
   */
  goToCommunity(): void {
    this.router.navigate(['/community']);
  }

  /**
   * Navigiert zur Landing-Page
   */
  goToLanding(): void {
    this.router.navigate(['/landing']);
  }

  /**
   * Navigiert zur Login-Seite
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navigiert zur Admin-Seite
   */
  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  /**
   * Loggt den Nutzer aus und setzt Admin-Status zurück
   */
  logout(): void {
    this.authService.logout();
    this.isAdminUser = false;
    this.router.navigate(['/login']);
  }

  /**
   * Prüft, ob ein Nutzer eingeloggt ist
   * @returns true, wenn eingeloggt
   */
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  /**
   * Prüft, ob der aktuelle Nutzer Admin ist
   * @returns true, wenn Admin
   */
  isAdmin(): boolean {
    return this.isAdminUser;
  }
} 