import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { of } from 'rxjs';

const mockAuthService = { isLoggedIn: () => true, isAdmin: () => true, logout: () => {} };
const mockRouter = { navigate: () => {} };

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: 'AuthService', useValue: mockAuthService },
        { provide: 'Router', useValue: mockRouter },
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show admin badge if admin', () => {
    expect(component.isAdmin()).toBeTrue();
  });
}); 