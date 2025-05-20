import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

const mockAuthService = { login: () => of({ token: 'abc' }), isLoggedIn: () => false, checkAdminStatus: () => of(false), setToken: () => {} };
const mockRouter = { navigate: () => {} };

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: 'AuthService', useValue: mockAuthService },
        { provide: 'Router', useValue: mockRouter },
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error on failed login', () => {
    component['authService'].login = () => throwError(() => ({ error: { message: 'fail' } }));
    component.loginForm.setValue({ username: 'a', password: 'b' });
    component.onSubmit();
    expect(component.errorMessage).toBeTruthy();
  });
}); 