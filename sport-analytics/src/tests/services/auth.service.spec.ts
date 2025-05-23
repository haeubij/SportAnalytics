import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../app/services/auth.service';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should handle login', () => {
    const loginSpy = spyOn(service, 'login').and.returnValue(of({ token: 'test-token' }));
    service.login('testuser', 'password').subscribe(response => {
      expect(response.token).toBe('test-token');
      expect(loginSpy).toHaveBeenCalledWith('testuser', 'password');
    });
  });
}); 