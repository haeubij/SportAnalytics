import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from '@app/components/login/login.component';
import { AuthService } from '@app/services/auth.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', [
      'login',
      'setToken',
      'isLoggedIn',
      'checkAdminStatus'
    ]);

    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent], // standalone component
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should validate username and password correctly', () => {
    component.loginForm.setValue({
      username: 'testuser',
      password: 'password123'
    });

    expect(component.loginForm.valid).toBeTrue();
  });

  it('should login and navigate to admin when admin user', () => {
    authServiceMock.login.and.returnValue(of({ token: 'fake-token' }));
    authServiceMock.checkAdminStatus.and.returnValue(of(true));

    component.loginForm.setValue({
      username: 'admin',
      password: 'password123'
    });

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalled();
    expect(authServiceMock.setToken).toHaveBeenCalledWith('fake-token');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('should login and navigate to landing when normal user', () => {
    authServiceMock.login.and.returnValue(of({ token: 'fake-token' }));
    authServiceMock.checkAdminStatus.and.returnValue(of(false));

    component.loginForm.setValue({
      username: 'user',
      password: 'password123'
    });

    component.onSubmit();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/landing']);
  });

  it('should show error message on login failure', () => {
    authServiceMock.login.and.returnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } }))
    );

    component.loginForm.setValue({
      username: 'wrong',
      password: 'wrongpass'
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to register page', () => {
    component.goToRegister();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/register']);
  });
});
