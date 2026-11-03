import {validate} from '../src/shared/helpers';

const isValidPassword = password => validate(password, {characterValidator: true});

describe('validate characterValidator', () => {
  it('accepts 8+ characters with a digit and an uppercase letter', () => {
    expect(isValidPassword('Password1')).toBe(true);
    expect(isValidPassword('Abcdefg1')).toBe(true);
    expect(isValidPassword('1234567Ä')).toBe(true);
  });

  it('rejects fewer than 8 characters', () => {
    expect(isValidPassword('Passwo1')).toBe(false);
  });

  it('rejects a password with no digit', () => {
    expect(isValidPassword('Password')).toBe(false);
  });

  it('rejects a password with no uppercase letter', () => {
    expect(isValidPassword('password1')).toBe(false);
    expect(isValidPassword('12345678')).toBe(false);
  });

  it('rejects any whitespace', () => {
    expect(isValidPassword('Pass word1')).toBe(false);
    expect(isValidPassword('Password1\t')).toBe(false);
  });

  it('gives the same answer on repeated calls', () => {
    expect(isValidPassword('Password1')).toBe(true);
    expect(isValidPassword('Password1')).toBe(true);
  });
});
