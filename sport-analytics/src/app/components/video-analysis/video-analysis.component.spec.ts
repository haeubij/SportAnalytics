import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoAnalysisComponent } from './video-analysis.component';
import { of } from 'rxjs';

const mockVideoService = { getVideos: () => of([]), deleteVideo: () => of({}) };
const mockAuthService = { isLoggedIn: () => true };


describe('VideoAnalysisComponent', () => {
  let component: VideoAnalysisComponent;
  let fixture: ComponentFixture<VideoAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoAnalysisComponent],
      providers: [
        { provide: 'VideoService', useValue: mockVideoService },
        { provide: 'AuthService', useValue: mockAuthService },
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(VideoAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open and close upload modal', () => {
    component.openUploadModal();
    expect(component.showUploadModal).toBeTrue();
    component.closeUploadModal();
    expect(component.showUploadModal).toBeFalse();
  });
}); 