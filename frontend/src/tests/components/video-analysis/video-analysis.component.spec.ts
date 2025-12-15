import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { VideoAnalysisComponent } from '@app/components/video-analysis/video-analysis.component';
import { AuthService } from '@app/services/auth.service';
import { VideoService } from '@app/services/video.service';
import { of, throwError } from 'rxjs';

describe('VideoAnalysisComponent', () => {
  let component: VideoAnalysisComponent;
  let fixture: ComponentFixture<VideoAnalysisComponent>;
  let videoServiceMock: jasmine.SpyObj<VideoService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    videoServiceMock = jasmine.createSpyObj('VideoService', [
      'getVideos',
      'uploadVideo',
      'deleteVideo'
    ]);

    authServiceMock = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [VideoAnalysisComponent],
      providers: [
        { provide: VideoService, useValue: videoServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VideoAnalysisComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    videoServiceMock.getVideos.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should redirect to login when not logged in', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should load videos when logged in', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    videoServiceMock.getVideos.and.returnValue(of([]));
    fixture.detectChanges();
    expect(videoServiceMock.getVideos).toHaveBeenCalled();
  });

  it('should set videos on successful load', () => {
    const mockVideos: any[] = [{ _id: '1', title: 'Test Video' }];
    authServiceMock.isLoggedIn.and.returnValue(true);
    videoServiceMock.getVideos.and.returnValue(of(mockVideos));
    fixture.detectChanges();
    expect(component.videos.length).toBe(1);
  });

  it('should handle error when loading videos', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    videoServiceMock.getVideos.and.returnValue(throwError(() => ({})));
    fixture.detectChanges();
    expect(component.errorMessage).toContain('Fehler beim Laden');
  });

  it('should open upload modal', () => {
    component.openUploadModal();
    expect(component.showUploadModal).toBeTrue();
  });

  it('should close upload modal', () => {
    component.showUploadModal = true;
    component.closeUploadModal();
    expect(component.showUploadModal).toBeFalse();
  });

  it('should reset upload form', () => {
    component.videoDescription = 'desc';
    component.selectedFile = {} as File;
    component.isPublic = true;
    component.resetUploadForm();
    expect(component.videoDescription).toBe('');
    expect(component.selectedFile).toBeNull();
    expect(component.isPublic).toBeFalse();
  });

  it('should set selected file on file select', () => {
    const file = new File([''], 'test.mp4');
    const event = {
      target: { files: [file] }
    } as any;

    component.onFileSelected(event);
    expect(component.selectedFile).toBe(file);
  });

  it('should not upload when no file selected', () => {
    component.selectedFile = null;
    component.uploadVideo();
    expect(component.errorMessage).toContain('Bitte wählen Sie zuerst');
  });

  it('should upload video and reload list', () => {
    const file = new File([''], 'test.mp4');
    component.selectedFile = file;
    authServiceMock.isLoggedIn.and.returnValue(true);
    videoServiceMock.uploadVideo.and.returnValue(of({}));
    videoServiceMock.getVideos.and.returnValue(of([]));

    component.uploadVideo();

    expect(videoServiceMock.uploadVideo).toHaveBeenCalled();
  });

  it('should handle upload error', () => {
    const file = new File([''], 'test.mp4');
    component.selectedFile = file;
    videoServiceMock.uploadVideo.and.returnValue(throwError(() => ({})));

    component.uploadVideo();

    expect(component.errorMessage).toContain('Fehler beim Hochladen');
  });

  it('should delete video after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    videoServiceMock.deleteVideo.and.returnValue(of({}));
    videoServiceMock.getVideos.and.returnValue(of([]));

    component.deleteVideo('123');

    expect(videoServiceMock.deleteVideo).toHaveBeenCalledWith('123');
  });

  it('should not delete video when confirmation is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteVideo('123');

    expect(videoServiceMock.deleteVideo).not.toHaveBeenCalled();
  });
});
