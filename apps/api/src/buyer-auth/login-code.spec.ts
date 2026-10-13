import {
  generateLoginCode,
  hashLoginCode,
  LOGIN_CODE_LENGTH,
  matchesLoginCode,
} from './login-code';

const SECRET = 'test-secret-that-is-long-enough-for-hmac';

describe('login codes', () => {
  it('generates 6-digit codes, keeping leading zeros', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateLoginCode()).toMatch(/^\d{6}$/);
    }
    expect(LOGIN_CODE_LENGTH).toBe(6);
  });

  it('matches only the same code for the same email', () => {
    const hash = hashLoginCode(SECRET, 'a@x.test', '012345');
    expect(hash).not.toContain('012345');
    expect(matchesLoginCode(hash, SECRET, 'a@x.test', '012345')).toBe(true);
    expect(matchesLoginCode(hash, SECRET, 'a@x.test', '012346')).toBe(false);
    expect(matchesLoginCode(hash, SECRET, 'b@x.test', '012345')).toBe(false);
    expect(matchesLoginCode(hash, 'another-secret', 'a@x.test', '012345')).toBe(
      false,
    );
  });

  it('rejects a malformed stored hash without throwing', () => {
    expect(matchesLoginCode('not-hex', SECRET, 'a@x.test', '012345')).toBe(
      false,
    );
  });
});
