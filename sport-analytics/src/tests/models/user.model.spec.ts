import { User } from '../../app/models/user.model';

describe('User Model', () => {
  it('should create a user instance', () => {
    const user = new User({
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    });

    expect(user).toBeTruthy();
    expect(user.username).toBe('testuser');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('user');
  });

  it('should handle missing optional fields', () => {
    const user = new User({
      id: '1',
      username: 'testuser'
    });

    expect(user).toBeTruthy();
    expect(user.username).toBe('testuser');
    expect(user.email).toBeUndefined();
    expect(user.role).toBeUndefined();
  });
}); 