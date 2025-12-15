import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { VideoService } from '@app/services/video.service';
import { CommunityComponent } from '@app/components/community/community.component';

describe('CommunityComponent', () => {
  let component: CommunityComponent;
  let fixture: ComponentFixture<CommunityComponent>;
  let videoServiceMock: jasmine.SpyObj<VideoService>;
  let httpClientMock: jasmine.SpyObj<HttpClient>;

  beforeEach(async () => {
    videoServiceMock = jasmine.createSpyObj('VideoService', ['getPublicVideos']);
    httpClientMock = jasmine.createSpyObj('HttpClient', ['get']);

    await TestBed.configureTestingModule({
      imports: [CommunityComponent],
      providers: [
        { provide: VideoService, useValue: videoServiceMock },
        { provide: HttpClient, useValue: httpClientMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommunityComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    videoServiceMock.getPublicVideos.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load public videos on init', () => {
    videoServiceMock.getPublicVideos.and.returnValue(of([]));
    fixture.detectChanges();
    expect(videoServiceMock.getPublicVideos).toHaveBeenCalled();
  });

  it('should set public videos on successful load', () => {
    const mockVideos: any[] = [
      {
        title: 'Public Video',
        uploadedAt: '2024-05-01T10:00:00Z'
      }
    ];

    videoServiceMock.getPublicVideos.and.returnValue(of(mockVideos));
    fixture.detectChanges();

    expect(component.publicVideos.length).toBe(1);
    expect(component.loading).toBeFalse();
    expect(component.publicVideos[0].uploadedAt instanceof Date).toBeTrue();
  });

  it('should handle error when loading public videos', () => {
    videoServiceMock.getPublicVideos.and.returnValue(
      throwError(() => ({}))
    );

    fixture.detectChanges();

    expect(component.errorMessage).toContain('Fehler beim Laden');
    expect(component.loading).toBeFalse();
    expect(component.publicVideos.length).toBe(0);
  });

  it('should reset error message before loading', () => {
    component.errorMessage = 'Old error';
    videoServiceMock.getPublicVideos.and.returnValue(of([]));

    component.loadPublicVideos();

    expect(component.errorMessage).toBe('');
  });
});
