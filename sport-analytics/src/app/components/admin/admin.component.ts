import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { VideoService } from '../../services/video.service';
import { UserService } from '../../services/user.service';
import { Video } from '../../interfaces/video.interface';
import { User } from '../../interfaces/user.interface';

/**
 * @author Janis Häubi
 * @version 1.0.0
 * @date 21.05.2024 (KW21)
 * @purpose Admin-Komponente für Benutzer- und Videoverwaltung
 * @description Ermöglicht Admins das Verwalten von Benutzern, Videos, Rollen und Passwörtern.
 */
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
  
  /**
   * Konstruktor initialisiert Router, AuthService, VideoService und UserService
   * @param router Angular Router
   * @param authService Service für Authentifizierung
   * @param videoService Service für Videos
   * @param userService Service für Benutzer
   */
  constructor(
    private router: Router,
    private authService: AuthService,
    private videoService: VideoService,
    private userService: UserService
  ) { }

  /**
   * Initialisiert die Komponente, prüft Admin-Status und lädt Daten
   */
  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadUsers();
      this.loadVideos();
    }
    this.authService.checkAdminStatus().subscribe(isAdmin => {
      if (!isAdmin) {
        this.router.navigate(['/login']);
        return;
      }
      this.loadUsers();
      this.loadVideos();
    });
  }

  /**
   * Setzt den aktiven Tab ("videos" oder "users")
   * @param tab Tab-Name
   */
  setActiveTab(tab: 'videos' | 'users'): void {
    this.activeTab = tab;
  }

  /**
   * Lädt alle Videos
   */
  loadVideos(): void {
    this.loading = true;
    this.videoService.getVideos().subscribe({
      next: (videos) => {
        this.videos = videos;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Fehler beim Laden der Videos. Bitte erneut versuchen.';
        this.loading = false;
      }
    });
  }

  /**
   * Lädt alle Benutzer
   */
  loadUsers(): void {
    this.userLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.userLoading = false;
      },
      error: () => {
        this.errorMessage = 'Fehler beim Laden der Benutzer. Bitte erneut versuchen.';
        this.userLoading = false;
      }
    });
  }

  /**
   * Löscht ein Video nach Bestätigung
   * @param videoId ID des zu löschenden Videos
   */
  deleteVideo(videoId: string): void {
    if (confirm('Möchten Sie dieses Video wirklich löschen?')) {
      this.videoService.deleteVideo(videoId).subscribe({
        next: () => {
          this.loadVideos();
        },
        error: () => {
          this.errorMessage = 'Fehler beim Löschen des Videos. Bitte erneut versuchen.';
        }
      });
    }
  }

  /**
   * Löscht einen Benutzer nach Bestätigung
   * @param userId ID des zu löschenden Benutzers
   */
  deleteUser(userId: string): void {
    if (confirm('Möchten Sie diesen Benutzer wirklich löschen? Alle zugehörigen Videos werden ebenfalls gelöscht.')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers();
          this.loadVideos();
        },
        error: () => {
          this.errorMessage = 'Fehler beim Löschen des Benutzers. Bitte erneut versuchen.';
        }
      });
    }
  }

  /**
   * Wechselt die Rolle eines Benutzers nach Bestätigung
   * @param user Benutzerobjekt
   */
  toggleUserRole(user: User): void {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (confirm(`Möchten Sie die Rolle dieses Benutzers wirklich zu ${newRole} ändern?`)) {
      this.userService.changeUserRole(user._id!, newRole).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: () => {
          this.errorMessage = 'Fehler beim Ändern der Rolle. Bitte erneut versuchen.';
        }
      });
    }
  }

  /**
   * Sperrt oder entsperrt einen Benutzer nach Bestätigung
   * @param user Benutzerobjekt
   */
  toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    const message = newStatus ? 'aktivieren' : 'deaktivieren';
    if (confirm(`Möchten Sie diesen Benutzer wirklich ${message}?`)) {
      this.userService.toggleUserStatus(user._id!, newStatus).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: () => {
          this.errorMessage = 'Fehler beim Ändern des Status. Bitte erneut versuchen.';
        }
      });
    }
  }

  /**
   * Öffnet das Passwort-Reset-Modal für einen Benutzer
   * @param userId ID des Benutzers
   */
  openPasswordReset(userId: string): void {
    this.selectedUserId = userId;
    this.newPassword = '';
  }

  /**
   * Setzt das Passwort eines Benutzers zurück
   */
  resetPassword(): void {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage = 'Passwort muss mindestens 6 Zeichen lang sein';
      return;
    }
    this.userService.resetUserPassword(this.selectedUserId, this.newPassword).subscribe({
      next: () => {
        this.successMessage = 'Passwort erfolgreich zurückgesetzt';
        this.selectedUserId = '';
        this.newPassword = '';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: () => {
        this.errorMessage = 'Fehler beim Zurücksetzen des Passworts. Bitte erneut versuchen.';
      }
    });
  }
  
  /**
   * Storniert das Passwort-Reset
   */
  cancelPasswordReset(): void {
    this.selectedUserId = '';
    this.newPassword = '';
  }

  /**
   * Filtert Benutzer basierend auf der Suchzeichenfolge
   * @returns Filterte Benutzer
   */
  get filteredUsers(): User[] {
    if (!this.searchTerm) return this.users;
    
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(user => 
      user.username.toLowerCase().includes(term) || 
      user.email.toLowerCase().includes(term)
    );
  }

  /**
   * Filtert Videos basierend auf der Suchzeichenfolge
   * @returns Filterte Videos
   */
  get filteredVideos(): Video[] {
    if (!this.searchTerm) return this.videos;
    
    const term = this.searchTerm.toLowerCase();
    return this.videos.filter(video => 
      video.title.toLowerCase().includes(term) || 
      (video.description && video.description.toLowerCase().includes(term)) ||
      (video.uploadedBy && video.uploadedBy.username.toLowerCase().includes(term))
    );
  }

  /**
   * Öffnet den Bestätigungsdialog
   * @param videoId ID des zu löschenden Videos
   */
  confirmDeleteVideo(videoId: string): void {
    this.videoToDelete = videoId;
    this.showDeleteDialog = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Löscht das Video nach Bestätigung
   */
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

  /**
   * Schließt den Dialog ohne zu löschen
   */
  cancelDelete(): void {
    this.showDeleteDialog = false;
    this.videoToDelete = null;
  }

  /**
   * Öffnet den Bestätigungsdialog für User-Löschen
   * @param userId ID des zu löschenden Benutzers
   */
  confirmDeleteUser(userId: string): void {
    this.userToDelete = userId;
    this.showUserDeleteDialog = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Löscht den User nach Bestätigung
   */
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

  /**
   * Öffnet den Dialog für Rollenwechsel
   * @param user Benutzerobjekt
   */
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

  /**
   * Öffnet den Dialog für Statuswechsel
   * @param user Benutzerobjekt
   */
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