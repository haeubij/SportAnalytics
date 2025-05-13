import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;
  usernameExists: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Check username availability on input
    this.registerForm.get('username')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(username => this.authService.checkUsername(username))
    ).subscribe({
      next: (response) => {
        this.usernameExists = response.exists;
      },
      error: (error) => {
        console.error('Error checking username:', error);
      }
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.usernameExists) {
      this.loading = true;
      const { username, email, password } = this.registerForm.value;

      this.authService.register({ username, email, password } as any).subscribe({
        next: (response) => {
          this.authService.setToken(response.token);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.errorMessage = error.error.message || 'Registration failed. Please try again.';
          this.loading = false;
        }
      });
    }
  }

  // Navigate back to login page
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
} 