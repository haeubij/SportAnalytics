import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

/**
 * @author Manuel Affolter
 * @version 1.0.0
 * @date 14.05.2024 (KW20)
 * @purpose Registrierungs-Komponente für neue Benutzer
 * @description Ermöglicht die Registrierung neuer Benutzer. Validiert Eingaben, prüft Benutzernamen und behandelt Fehler.
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class RegisterComponent implements OnInit {
  /**
   * Formulargruppe für die Registrierungsdaten
   */
  registerForm: FormGroup;
  /**
   * Fehlermeldung für das UI
   */
  errorMessage: string = '';
  /**
   * Zeigt Ladezustand während der Registrierung
   */
  loading: boolean = false;
  /**
   * Gibt an, ob der Benutzername bereits existiert
   */
  usernameExists: boolean = false;

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
    // Initialisiere das Registrierungsformular mit Validierung
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Initialisiert die Komponente und prüft die Verfügbarkeit des Benutzernamens.
   */
  ngOnInit(): void {
    // Prüft bei jeder Änderung des Benutzernamens, ob dieser bereits existiert
    this.registerForm.get('username')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(username => this.authService.checkUsername(username))
    ).subscribe({
      next: (response) => {
        this.usernameExists = response.exists;
      },
      error: (error) => {
        console.error('Fehler bei der Benutzernamen-Prüfung:', error);
      }
    });
  }

  /**
   * Validator, um zu prüfen, ob die Passwörter übereinstimmen.
   * @param form Das Formular mit Passwortfeldern
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }
  }

  /**
   * Übermittelt das Registrierungsformular und erstellt einen neuen Benutzer.
   * @returns void
   */
  onSubmit(): void {
    if (this.registerForm.valid && !this.usernameExists) {
      this.loading = true;
      const { username, email, password } = this.registerForm.value;

      // Sende Registrierungsdaten an den AuthService
      this.authService.register({ username, email, password } as any).subscribe({
        next: (response) => {
          this.authService.setToken(response.token);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.errorMessage = error.error.message || 'Registrierung fehlgeschlagen. Bitte erneut versuchen.';
          this.loading = false;
        }
      });
    }
  }

  /**
   * Navigiert zurück zur Login-Seite.
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
} 