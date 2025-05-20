import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommunityComponent } from './community.component';
import { of, throwError } from 'rxjs';

const mockVideoService = { getPublicVideos: () => of([]) };

describe('CommunityComponent', () => {
  let component: CommunityComponent;
  let fixture: ComponentFixture<CommunityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityComponent],
      providers: [
        { provide: 'VideoService', useValue: mockVideoService },
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(CommunityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load public videos', () => {
    component.ngOnInit();
    expect(component.publicVideos).toBeDefined();
  });

  it('should show error on load failure', () => {
    component['videoService'].getPublicVideos = () => throwError(() => new Error('fail'));
    component.ngOnInit();
    expect(component.errorMessage).toBeTruthy();
  });
}); 