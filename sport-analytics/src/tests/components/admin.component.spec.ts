import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComponent } from '../../app/components/admin/admin.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

// Mock-Services
const mockVideoService = { getVideos: () => of([]), deleteVideo: () => of({}) };
const mockUserService = { getAllUsers: () => of([]), deleteUser: () => of({}), changeUserRole: () => of({}), toggleUserStatus: () => of({}) };
const mockAuthService = { isAdmin: () => true, checkAdminStatus: () => of(true) };

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      declarations: [ AdminComponent ],
      providers: [
        { provide: 'VideoService', useValue: mockVideoService },
        { provide: 'UserService', useValue: mockUserService },
        { provide: 'AuthService', useValue: mockAuthService },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should switch tabs', () => {
    component.setActiveTab('videos');
    expect(component.activeTab).toBe('videos');
    component.setActiveTab('users');
    expect(component.activeTab).toBe('users');
  });

  it('should open delete dialog', () => {
    component.confirmDeleteVideo('123');
    expect(component.showDeleteDialog).toBeTrue();
    expect(component.videoToDelete).toBe('123');
  });

  it('should filter users', () => {
    component.users = [{_id: '1', username: 'max', email: 'm@x.de', role: 'user', isActive: true} as any];
    component.searchTerm = 'max';
    expect(component.filteredUsers.length).toBe(1);
  });

  it('should filter videos', () => {
    component.videos = [{_id: '1', title: 'Testvideo', isPublic: true, uploadedAt: new Date()} as any];
    component.searchTerm = 'Testvideo';
    expect(component.filteredVideos.length).toBe(1);
  });
}); 