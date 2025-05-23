import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from '../../app/components/register/register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

const mockAuthService = { register: () => of({}) };
const mockRouter = { navigate: () => {} };

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      declarations: [ RegisterComponent ],
      providers: [
        { provide: 'AuthService', useValue: mockAuthService },
        { provide: 'Router', useValue: mockRouter },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error on failed registration', () => {
    component['authService'].register = () => throwError(() => ({ error: { message: 'fail' } }));
    component.registerForm.setValue({ username: 'a', email: 'b@b.de', password: '123456', passwordRepeat: '123456', confirmPassword: '123456' });
    component.onSubmit();
    expect(component.errorMessage).toBeTruthy();
  });
}); 