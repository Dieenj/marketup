import { validateEnv } from './env.validation';

const SECRET = 'k'.repeat(40);
const base = { DATABASE_URL: 'postgresql://localhost/db', JWT_SECRET: SECRET };

describe('validateEnv', () => {
  it('accepts a complete configuration', () => {
    expect(validateEnv({ ...base, TRUST_PROXY_HOPS: '3' })).toMatchObject(base);
  });

  it.each([
    ['missing DATABASE_URL', { JWT_SECRET: SECRET }, /DATABASE_URL/],
    ['missing JWT_SECRET', { DATABASE_URL: 'x' }, /JWT_SECRET/],
    ['short JWT_SECRET', { ...base, JWT_SECRET: 'short-secret' }, /JWT_SECRET/],
    [
      'the public placeholder secret',
      { ...base, JWT_SECRET: 'your-super-secret-jwt-key-change-in-production' },
      /placeholder/,
    ],
    [
      'non-numeric TRUST_PROXY_HOPS',
      { ...base, TRUST_PROXY_HOPS: 'abc' },
      /TRUST_PROXY_HOPS/,
    ],
  ])('rejects %s', (_label, env, message) => {
    expect(() => validateEnv(env)).toThrow(message);
  });
});
