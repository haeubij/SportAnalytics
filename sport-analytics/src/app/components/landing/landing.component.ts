import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * @author Janis Häubi
 * @version 1.0.0
 * @date 07.05.2024 (KW19)
 * @purpose Landing-Komponente (Startseite)
 * @description Zeigt die Startseite, Features und Navigation für eingeloggte und nicht eingeloggte Nutzer.
 */
@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class LandingComponent implements OnInit {
  /**
   * Gibt an, ob der Nutzer eingeloggt ist
   */
  isUserLoggedIn: boolean = false;

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
   * Initialisiert die Komponente und prüft Login-Status
   */
  ngOnInit(): void {
    // Check if user is logged in
    this.isUserLoggedIn = this.authService.isLoggedIn();
  }

  /**
   * Navigiert zur Videoanalyse-Seite (oder Login, wenn nicht eingeloggt)
   */
  goToVideoAnalysis(): void {
    if (this.isUserLoggedIn) {
      this.router.navigate(['/video-analysis']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Navigiert zur Login-Seite
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navigiert zur Registrierungsseite
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  /**
   * Navigiert zur Community-Seite
   */
  goToCommunity(): void {
    this.router.navigate(['/community']);
  }
} 