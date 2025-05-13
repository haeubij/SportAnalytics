import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { LandingComponent } from './components/landing/landing.component';
import { VideoAnalysisComponent } from './components/video-analysis/video-analysis.component';
import { AuthService } from './services/auth.service';
import { inject } from '@angular/core';

const authGuard = () => {
  const authService = inject(AuthService);
  return authService.isLoggedIn();
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'landing', component: LandingComponent, canActivate: [authGuard] },
  { path: 'video-analysis', component: VideoAnalysisComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
