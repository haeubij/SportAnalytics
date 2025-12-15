import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from '@app/components/register/register.component';
import { AuthService } from '@app/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', [
      'register',
      'setToken',
      'checkUsername'
    ]);

    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    authServiceMock.checkUsername.and.returnValue(of({ exists: false }));

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form initially', () => {
    expect(component.registerForm.invalid).toBeTrue();
  });

  it('should validate password mismatch', () => {
    component.registerForm.setValue({
      username: 'testuser',
      email: 'test@test.com',
      password: '123456',
      confirmPassword: '654321'
    });

    expect(component.registerForm.invalid).toBeTrue();
  });

  it('should set usernameExists when username already exists', fakeAsync(() => {
    authServiceMock.checkUsername.and.returnValue(of({ exists: true }));

    component.registerForm.get('username')?.setValue('existinguser');
    tick(300);

    expect(component.usernameExists).toBeTrue();
  }));

  it('should call register and navigate on successful submit', fakeAsync(() => {
    authServiceMock.register.and.returnValue(of({ token: 'test-token' }));

    component.registerForm.setValue({
      username: 'newuser',
      email: 'new@test.com',
      password: '123456',
      confirmPassword: '123456'
    });

    component.onSubmit();
    tick();

    expect(authServiceMock.register).toHaveBeenCalled();
    expect(authServiceMock.setToken).toHaveBeenCalledWith('test-token');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should set errorMessage on register error', fakeAsync(() => {
    authServiceMock.register.and.returnValue(
      throwError(() => ({ error: { message: 'Registrierung fehlgeschlagen' } }))
    );

    component.registerForm.setValue({
      username: 'newuser',
      email: 'new@test.com',
      password: '123456',
      confirmPassword: '123456'
    });

    component.onSubmit();
    tick();

    expect(component.errorMessage).toBe('Registrierung fehlgeschlagen');
    expect(component.loading).toBeFalse();
  }));

  it('should navigate to login when goToLogin is called', () => {
    component.goToLogin();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
});
