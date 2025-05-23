import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoAnalysisComponent } from '../../app/components/video-analysis/video-analysis.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

const mockVideoService = { getVideos: () => of([]), deleteVideo: () => of({}) };
const mockAuthService = { isLoggedIn: () => true };

describe('VideoAnalysisComponent', () => {
  let component: VideoAnalysisComponent;
  let fixture: ComponentFixture<VideoAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      declarations: [ VideoAnalysisComponent ],
      providers: [
        { provide: 'VideoService', useValue: mockVideoService },
        { provide: 'AuthService', useValue: mockAuthService },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
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