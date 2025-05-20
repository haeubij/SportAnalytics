import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

const mockAuthService = { register: () => of({}) };
const mockRouter = { navigate: () => {} };

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        { provide: 'AuthService', useValue: mockAuthService },
        { provide: 'Router', useValue: mockRouter },
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error on failed registration', () => {
    component['authService'].register = () => throwError(() => ({ error: { message: 'fail' } }));
    component.registerForm.setValue({ username: 'a', email: 'b@b.de', password: '123456', passwordRepeat: '123456' });
    component.onSubmit();
    expect(component.errorMessage).toBeTruthy();
  });
}); 