import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, of } from 'rxjs';
import { AuthService } from '@app/services/auth.service';
import { HeaderComponent } from '@app/components/header/header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let routerMock: jasmine.SpyObj<Router>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerEvents$: Subject<any>;

  beforeEach(async () => {
    routerEvents$ = new Subject();

    routerMock = jasmine.createSpyObj('Router', ['navigate'], {
      events: routerEvents$
    });

    authServiceMock = jasmine.createSpyObj('AuthService', [
      'isLoggedIn',
      'isAdmin',
      'checkAdminStatus',
      'logout'
    ]);

    authServiceMock.checkAdminStatus.and.returnValue(of(false));

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should set isAdminUser to false when not logged in', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    expect(component.isAdminUser).toBeFalse();
  });

  it('should set isAdminUser based on service when logged in', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.isAdmin.and.returnValue(true);
    authServiceMock.checkAdminStatus.and.returnValue(of(true));

    fixture.detectChanges();

    expect(component.isAdminUser).toBeTrue();
  });

  it('should recheck admin status on navigation end', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.isAdmin.and.returnValue(false);
    authServiceMock.checkAdminStatus.and.returnValue(of(true));

    fixture.detectChanges();
    routerEvents$.next(new NavigationEnd(1, '/a', '/b'));

    expect(component.isAdminUser).toBeTrue();
  });

  it('should navigate to video analysis', () => {
    component.goToVideoAnalysis();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/video-analysis']);
  });

  it('should navigate to community', () => {
    component.goToCommunity();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/community']);
  });

  it('should navigate to landing', () => {
    component.goToLanding();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/landing']);
  });

  it('should navigate to login', () => {
    component.goToLogin();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to admin', () => {
    component.goToAdmin();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('should logout and navigate to login', () => {
    component.isAdminUser = true;
    component.logout();
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(component.isAdminUser).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should return login status', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    expect(component.isLoggedIn()).toBeTrue();
  });

  it('should return admin status', () => {
    component.isAdminUser = true;
    expect(component.isAdmin()).toBeTrue();
  });

  it('should unsubscribe on destroy', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    const spy = spyOn<any>(component['routerSubscription'], 'unsubscribe');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });
});
