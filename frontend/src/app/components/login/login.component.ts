import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * @author Manuel Affolter
 * @version 1.0.0
 * @date 07.05.2024 (KW19)
 * @purpose Login-Komponente für die Benutzeranmeldung
 * @description Ermöglicht Benutzern das Einloggen in die Anwendung. Prüft Anmeldedaten, verwaltet Weiterleitung und Fehlerbehandlung.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent implements OnInit {
  /**
   * Formulargruppe für die Login-Daten
   */
  loginForm: FormGroup;
  /**
   * Fehlermeldung für das UI
   */
  errorMessage: string = '';
  /**
   * Zeigt Ladezustand während der Authentifizierung
   */
  loading: boolean = false;

  /**
   * Konstruktor initialisiert FormBuilder, AuthService und Router
   * @param fb FormBuilder für reaktives Formular
   * @param authService Service für Authentifizierung
   * @param router Angular Router für Navigation
   */
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Initialisiere das Login-Formular mit Validierung
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Initialisiert die Komponente und prüft, ob der Nutzer bereits eingeloggt ist.
   * Leitet ggf. weiter.
   */
  ngOnInit(): void {
    // Prüfe, ob der Nutzer bereits eingeloggt ist
    if (this.authService.isLoggedIn()) {
      // Wenn Admin, direkt ins Admin-Dashboard weiterleiten
      this.authService.checkAdminStatus().subscribe(isAdmin => {
        if (isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/landing']);
        }
      });
    }
  }

  /**
   * Übermittelt das Login-Formular und authentifiziert den Nutzer.
   * @returns void
   */
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      const { username, password } = this.loginForm.value;

      // Sende Login-Daten an den AuthService
      this.authService.login(username, password).subscribe({
        next: (response) => {
          this.authService.setToken(response.token);
          // Nach erfolgreichem Login Admin-Status prüfen und weiterleiten
          this.authService.checkAdminStatus().subscribe(isAdmin => {
            if (isAdmin) {
              this.router.navigate(['/admin']);
            } else {
              this.router.navigate(['/landing']);
            }
          });
        },
        error: (error) => {
          this.errorMessage = error.error.message || 'Login fehlgeschlagen. Bitte erneut versuchen.';
          this.loading = false;
        }
      });
    }
  }

  /**
   * Navigiert zur Registrierungsseite.
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }
} 