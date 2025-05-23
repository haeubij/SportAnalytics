import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Gültiger Dummy-JWT (Header.Payload.Signature)
const DUMMY_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3QiLCJyb2xlIjoiYWRtaW4ifQ.sflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get token', () => {
    service.setToken(DUMMY_JWT);
    expect(service.getToken()).toBe(DUMMY_JWT);
  });
}); 