import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LandingComponent } from '@app/components/landing/landing.component';
import { AuthService } from '@app/services/auth.service';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;
  let routerMock: jasmine.SpyObj<Router>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    authServiceMock = jasmine.createSpyObj('AuthService', ['isLoggedIn']);

    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should set isUserLoggedIn to true when user is logged in', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    fixture.detectChanges();
    expect(component.isUserLoggedIn).toBeTrue();
  });

  it('should set isUserLoggedIn to false when user is not logged in', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    expect(component.isUserLoggedIn).toBeFalse();
  });

  it('should navigate to video-analysis when logged in', () => {
    component.isUserLoggedIn = true;
    component.goToVideoAnalysis();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/video-analysis']);
  });

  it('should navigate to login when not logged in', () => {
    component.isUserLoggedIn = false;
    component.goToVideoAnalysis();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to login', () => {
    component.goToLogin();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to register', () => {
    component.goToRegister();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('should navigate to community', () => {
    component.goToCommunity();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/community']);
  });
});
