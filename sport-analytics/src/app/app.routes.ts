import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { LandingComponent } from './components/landing/landing.component';
import { VideoAnalysisComponent } from './components/video-analysis/video-analysis.component';
import { CommunityComponent } from './components/community/community.component';
import { AdminComponent } from './components/admin/admin.component';
import { AuthService } from './services/auth.service';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';

const authGuard = () => {
  const authService = inject(AuthService);
  return authService.isLoggedIn();
};

const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // First do a quick local check
  if (!authService.isAdmin()) {
    // If not admin according to local check, redirect immediately
    router.navigate(['/landing']);
    return false;
  }
  
  // Then verify with the server
  return authService.checkAdminStatus().pipe(
    map(isAdmin => {
      if (!isAdmin) {
        router.navigate(['/landing']);
        return false;
      }
      return true;
    })
  );
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'landing', component: LandingComponent, canActivate: [authGuard] },
  { path: 'video-analysis', component: VideoAnalysisComponent, canActivate: [authGuard] },
  { path: 'community', component: CommunityComponent },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
