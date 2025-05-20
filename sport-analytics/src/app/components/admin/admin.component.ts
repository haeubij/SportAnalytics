import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { VideoService } from '../../services/video.service';
import { UserService } from '../../services/user.service';
import { Video } from '../../interfaces/video.interface';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AdminComponent implements OnInit {
  videos: Video[] = [];
  users: User[] = [];
  loading: boolean = false;
  userLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  activeTab: 'videos' | 'users' = 'users';
  searchTerm: string = '';
  newPassword: string = '';
  selectedUserId: string = '';
  showDeleteDialog: boolean = false;
  videoToDelete: string | null = null;
  deleting: boolean = false;
  
  // Dialog-States für User-Aktionen
  showUserDeleteDialog: boolean = false;
  userToDelete: string | null = null;
  deletingUser: boolean = false;

  showRoleDialog: boolean = false;
  userToChangeRole: User | null = null;
  newRole: 'admin' | 'user' | null = null;
  changingRole: boolean = false;

  showStatusDialog: boolean = false;
  userToChangeStatus: User | null = null;
  newStatus: boolean | null = null;
  changingStatus: boolean = false;
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private videoService: VideoService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    // First use a local check to avoid delay
    if (this.authService.isAdmin()) {
      this.loadUsers();
      this.loadVideos();
    }
    
    // Then verify with server for security
    this.authService.checkAdminStatus().subscribe(isAdmin => {
      console.log('Admin status in admin component:', isAdmin);
      if (!isAdmin) {
        console.log('Not an admin, redirecting to login');
        this.router.navigate(['/login']);
        return;
      }
      
      // Wenn Admin-Status bestätigt ist, lade Daten
      this.loadUsers();
      this.loadVideos();
    });
  }

  // Set active tab
  setActiveTab(tab: 'videos' | 'users'): void {
    this.activeTab = tab;
  }

  // Load all videos
  loadVideos(): void {
    this.loading = true;
    this.videoService.getVideos().subscribe({
      next: (videos) => {
        this.videos = videos;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error loading videos. Please try again.';
        this.loading = false;
      }
    });
  }

  // Load all users
  loadUsers(): void {
    this.userLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.userLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error loading users. Please try again.';
        this.userLoading = false;
      }
    });
  }

  // Delete video
  deleteVideo(videoId: string): void {
    if (confirm('Are you sure you want to delete this video?')) {
      this.videoService.deleteVideo(videoId).subscribe({
        next: () => {
          this.loadVideos();
        },
        error: (error) => {
          this.errorMessage = 'Error deleting video. Please try again.';
        }
      });
    }
  }

  // Delete user
  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user? All their videos will also be deleted.')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers();
          this.loadVideos(); // Reload videos as some might have been deleted
        },
        error: (error) => {
          this.errorMessage = 'Error deleting user. Please try again.';
        }
      });
    }
  }

  // Toggle user role
  toggleUserRole(user: User): void {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      this.userService.changeUserRole(user._id!, newRole).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          this.errorMessage = 'Error changing user role. Please try again.';
        }
      });
    }
  }

  // Toggle user status
  toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    const message = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${message} this user?`)) {
      this.userService.toggleUserStatus(user._id!, newStatus).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          this.errorMessage = 'Error changing user status. Please try again.';
        }
      });
    }
  }

  // Open password reset dialog
  openPasswordReset(userId: string): void {
    this.selectedUserId = userId;
    this.newPassword = '';
  }
  
  // Reset user password
  resetPassword(): void {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }
    
    this.userService.resetUserPassword(this.selectedUserId, this.newPassword).subscribe({
      next: () => {
        this.successMessage = 'Password reset successful';
        this.selectedUserId = '';
        this.newPassword = '';
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.errorMessage = 'Error resetting password. Please try again.';
      }
    });
  }
  
  // Cancel password reset
  cancelPasswordReset(): void {
    this.selectedUserId = '';
    this.newPassword = '';
  }

  // Filter users based on search term
  get filteredUsers(): User[] {
    if (!this.searchTerm) return this.users;
    
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(user => 
      user.username.toLowerCase().includes(term) || 
      user.email.toLowerCase().includes(term)
    );
  }

  // Filter videos based on search term
  get filteredVideos(): Video[] {
    if (!this.searchTerm) return this.videos;
    
    const term = this.searchTerm.toLowerCase();
    return this.videos.filter(video => 
      video.title.toLowerCase().includes(term) || 
      (video.description && video.description.toLowerCase().includes(term)) ||
      (video.uploadedBy && video.uploadedBy.username.toLowerCase().includes(term))
    );
  }

  // Öffnet den Bestätigungsdialog
  confirmDeleteVideo(videoId: string): void {
    this.videoToDelete = videoId;
    this.showDeleteDialog = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Löscht das Video nach Bestätigung
  deleteVideoConfirmed(): void {
    if (!this.videoToDelete) return;
    this.deleting = true;
    this.videoService.deleteVideo(this.videoToDelete).subscribe({
      next: () => {
        this.loadVideos();
        this.successMessage = 'Video wurde erfolgreich gelöscht.';
        this.deleting = false;
        this.showDeleteDialog = false;
        this.videoToDelete = null;
      },
      error: (error) => {
        this.errorMessage = 'Fehler beim Löschen des Videos. Bitte versuchen Sie es erneut.';
        this.deleting = false;
        this.showDeleteDialog = false;
        this.videoToDelete = null;
      }
    });
  }

  // Schließt den Dialog ohne zu löschen
  cancelDelete(): void {
    this.showDeleteDialog = false;
    this.videoToDelete = null;
  }

  // Öffnet den Bestätigungsdialog für User-Löschen
  confirmDeleteUser(userId: string): void {
    this.userToDelete = userId;
    this.showUserDeleteDialog = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Löscht den User nach Bestätigung
  deleteUserConfirmed(): void {
    if (!this.userToDelete) return;
    this.deletingUser = true;
    this.userService.deleteUser(this.userToDelete).subscribe({
      next: () => {
        this.loadUsers();
        this.loadVideos();
        this.successMessage = 'Benutzer wurde erfolgreich gelöscht.';
        this.deletingUser = false;
        this.showUserDeleteDialog = false;
        this.userToDelete = null;
      },
      error: (error) => {
        this.errorMessage = 'Fehler beim Löschen des Benutzers. Bitte versuchen Sie es erneut.';
        this.deletingUser = false;
        this.showUserDeleteDialog = false;
        this.userToDelete = null;
      }
    });
  }

  cancelUserDelete(): void {
    this.showUserDeleteDialog = false;
    this.userToDelete = null;
  }

  // Öffnet den Dialog für Rollenwechsel
  confirmRoleChange(user: User): void {
    this.userToChangeRole = user;
    this.newRole = user.role === 'admin' ? 'user' : 'admin';
    this.showRoleDialog = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  changeUserRoleConfirmed(): void {
    if (!this.userToChangeRole || !this.newRole) return;
    this.changingRole = true;
    this.userService.changeUserRole(this.userToChangeRole._id!, this.newRole).subscribe({
      next: () => {
        this.loadUsers();
        this.successMessage = 'Benutzerrolle wurde geändert.';
        this.changingRole = false;
        this.showRoleDialog = false;
        this.userToChangeRole = null;
        this.newRole = null;
      },
      error: (error) => {
        this.errorMessage = 'Fehler beim Ändern der Rolle. Bitte versuchen Sie es erneut.';
        this.changingRole = false;
        this.showRoleDialog = false;
        this.userToChangeRole = null;
        this.newRole = null;
      }
    });
  }

  cancelRoleChange(): void {
    this.showRoleDialog = false;
    this.userToChangeRole = null;
    this.newRole = null;
  }

  // Öffnet den Dialog für Statuswechsel
  confirmStatusChange(user: User): void {
    this.userToChangeStatus = user;
    this.newStatus = !user.isActive;
    this.showStatusDialog = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  changeUserStatusConfirmed(): void {
    if (!this.userToChangeStatus || this.newStatus === null) return;
    this.changingStatus = true;
    this.userService.toggleUserStatus(this.userToChangeStatus._id!, this.newStatus).subscribe({
      next: () => {
        this.loadUsers();
        this.successMessage = 'Benutzerstatus wurde geändert.';
        this.changingStatus = false;
        this.showStatusDialog = false;
        this.userToChangeStatus = null;
        this.newStatus = null;
      },
      error: (error) => {
        this.errorMessage = 'Fehler beim Ändern des Status. Bitte versuchen Sie es erneut.';
        this.changingStatus = false;
        this.showStatusDialog = false;
        this.userToChangeStatus = null;
        this.newStatus = null;
      }
    });
  }

  cancelStatusChange(): void {
    this.showStatusDialog = false;
    this.userToChangeStatus = null;
    this.newStatus = null;
  }
} 