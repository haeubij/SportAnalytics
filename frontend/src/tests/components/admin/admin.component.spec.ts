import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminComponent } from '@app/components/admin/admin.component';
import { AuthService } from '@app/services/auth.service';
import { UserService } from '@app/services/user.service';
import { VideoService } from '@app/services/video.service';
import { of, throwError } from 'rxjs';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let routerMock: jasmine.SpyObj<Router>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let videoServiceMock: jasmine.SpyObj<VideoService>;
  let userServiceMock: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    authServiceMock = jasmine.createSpyObj('AuthService', ['isAdmin', 'checkAdminStatus']);
    videoServiceMock = jasmine.createSpyObj('VideoService', ['getVideos', 'deleteVideo']);
    userServiceMock = jasmine.createSpyObj('UserService', [
      'getAllUsers',
      'deleteUser',
      'changeUserRole',
      'toggleUserStatus',
      'resetUserPassword'
    ]);

    authServiceMock.isAdmin.and.returnValue(true);
    authServiceMock.checkAdminStatus.and.returnValue(of(true));
    videoServiceMock.getVideos.and.returnValue(of([]));
    userServiceMock.getAllUsers.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: VideoService, useValue: videoServiceMock },
        { provide: UserService, useValue: userServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users and videos when admin', () => {
    expect(userServiceMock.getAllUsers).toHaveBeenCalled();
    expect(videoServiceMock.getVideos).toHaveBeenCalled();
  });

  it('should redirect to login when not admin', () => {
    authServiceMock.checkAdminStatus.and.returnValue(of(false));
    component.ngOnInit();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should change active tab', () => {
    component.setActiveTab('videos');
    expect(component.activeTab).toBe('videos');
  });

  it('should delete video after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    videoServiceMock.deleteVideo.and.returnValue(of({}));
    component.deleteVideo('vid1');
    expect(videoServiceMock.deleteVideo).toHaveBeenCalledWith('vid1');
  });

  it('should delete user after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    userServiceMock.deleteUser.and.returnValue(of({}));
    component.deleteUser('user1');
    expect(userServiceMock.deleteUser).toHaveBeenCalledWith('user1');
  });

  it('should toggle user role', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    userServiceMock.changeUserRole.and.returnValue(of({}));

    const user: any = { _id: '1', role: 'user' };
    component.toggleUserRole(user);

    expect(userServiceMock.changeUserRole).toHaveBeenCalledWith('1', 'admin');
  });

  it('should toggle user status', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    userServiceMock.toggleUserStatus.and.returnValue(of({}));

    const user: any = { _id: '1', isActive: true };
    component.toggleUserStatus(user);

    expect(userServiceMock.toggleUserStatus).toHaveBeenCalledWith('1', false);
  });

  it('should open password reset', () => {
    component.openPasswordReset('123');
    expect(component.selectedUserId).toBe('123');
  });

  it('should cancel password reset', () => {
    component.selectedUserId = '123';
    component.newPassword = 'secret';
    component.cancelPasswordReset();
    expect(component.selectedUserId).toBe('');
    expect(component.newPassword).toBe('');
  });

  it('should not reset password if too short', () => {
    component.selectedUserId = '123';
    component.newPassword = '123';
    component.resetPassword();
    expect(component.errorMessage).toContain('mindestens 6');
  });

  it('should reset password successfully', () => {
    userServiceMock.resetUserPassword.and.returnValue(of({}));
    component.selectedUserId = '123';
    component.newPassword = 'password123';
    component.resetPassword();
    expect(component.successMessage).toContain('erfolgreich');
  });

  it('should filter users by search term', () => {
    component.users = [
      { username: 'test', email: 'a@test.com' } as any,
      { username: 'admin', email: 'admin@test.com' } as any
    ];
    component.searchTerm = 'admin';
    expect(component.filteredUsers.length).toBe(1);
  });

  it('should filter videos by search term', () => {
    component.videos = [
      { title: 'Football', uploadedBy: { username: 'max' } } as any,
      { title: 'Tennis', uploadedBy: { username: 'tom' } } as any
    ];
    component.searchTerm = 'tennis';
    expect(component.filteredVideos.length).toBe(1);
  });

  it('should confirm and delete video via dialog', () => {
    videoServiceMock.deleteVideo.and.returnValue(of({}));
    component.confirmDeleteVideo('vid1');
    component.deleteVideoConfirmed();
    expect(videoServiceMock.deleteVideo).toHaveBeenCalledWith('vid1');
  });

  it('should cancel video delete dialog', () => {
    component.confirmDeleteVideo('vid1');
    component.cancelDelete();
    expect(component.showDeleteDialog).toBeFalse();
  });

  it('should confirm and delete user via dialog', () => {
    userServiceMock.deleteUser.and.returnValue(of({}));
    component.confirmDeleteUser('user1');
    component.deleteUserConfirmed();
    expect(userServiceMock.deleteUser).toHaveBeenCalledWith('user1');
  });

  it('should cancel user delete dialog', () => {
    component.confirmDeleteUser('user1');
    component.cancelUserDelete();
    expect(component.showUserDeleteDialog).toBeFalse();
  });

  it('should confirm and change role via dialog', () => {
    userServiceMock.changeUserRole.and.returnValue(of({}));
    const user: any = { _id: '1', role: 'user' };
    component.confirmRoleChange(user);
    component.changeUserRoleConfirmed();
    expect(userServiceMock.changeUserRole).toHaveBeenCalledWith('1', 'admin');
  });

  it('should cancel role change dialog', () => {
    component.confirmRoleChange({ role: 'user' } as any);
    component.cancelRoleChange();
    expect(component.showRoleDialog).toBeFalse();
  });

  it('should confirm and change status via dialog', () => {
    userServiceMock.toggleUserStatus.and.returnValue(of({}));
    const user: any = { _id: '1', isActive: true };
    component.confirmStatusChange(user);
    component.changeUserStatusConfirmed();
    expect(userServiceMock.toggleUserStatus).toHaveBeenCalledWith('1', false);
  });

  it('should cancel status change dialog', () => {
    component.confirmStatusChange({ isActive: true } as any);
    component.cancelStatusChange();
    expect(component.showStatusDialog).toBeFalse();
  });
});
