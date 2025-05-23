import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from '../../app/components/header/header.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

const mockAuthService = { isLoggedIn: () => true, isAdmin: () => true, logout: () => {} };
const mockRouter = { navigate: () => {} };

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule
      ],
      declarations: [ HeaderComponent ],
      providers: [
        { provide: 'AuthService', useValue: mockAuthService },
        { provide: 'Router', useValue: mockRouter },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show admin badge if admin', () => {
    spyOn(component['authService'], 'isAdmin').and.returnValue(true);
    expect(component.isAdmin()).toBeTrue();
  });
}); 