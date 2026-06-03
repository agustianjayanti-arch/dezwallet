import {
    isValidEmail,
    isValidPassword,
    isValidPin,
    isValidAmount,
    isValidTopUpAmount,
} from '../validators';

describe('Validators', () => {
    describe('isValidEmail', () => {
        it('should accept valid email addresses', () => {
            expect(isValidEmail('user@example.com')).toBe(true);
            expect(isValidEmail('john.doe@company.co.uk')).toBe(true);
            expect(isValidEmail('test+tag@domain.org')).toBe(true);
        });

        it('should reject invalid email addresses', () => {
            expect(isValidEmail('invalid')).toBe(false);
            expect(isValidEmail('user@')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
            expect(isValidEmail('user @example.com')).toBe(false);
            expect(isValidEmail('')).toBe(false);
        });

        it('should trim whitespace', () => {
            expect(isValidEmail('  user@example.com  ')).toBe(true);
        });
    });

    describe('isValidPassword', () => {
        it('should accept password with 8 or more characters', () => {
            expect(isValidPassword('password')).toBe(true);
            expect(isValidPassword('longerpassword123')).toBe(true);
        });

        it('should reject password with less than 8 characters', () => {
            expect(isValidPassword('short')).toBe(false);
            expect(isValidPassword('pass7')).toBe(false);
        });

        it('should reject non-string input', () => {
            expect(isValidPassword(12345678 as any)).toBe(false);
            expect(isValidPassword(null as any)).toBe(false);
        });
    });

    describe('isValidPin', () => {
        it('should accept exactly 6 digits', () => {
            expect(isValidPin('123456')).toBe(true);
            expect(isValidPin('000000')).toBe(true);
            expect(isValidPin('999999')).toBe(true);
        });

        it('should reject non-numeric input', () => {
            expect(isValidPin('12345a')).toBe(false);
            expect(isValidPin('123-456')).toBe(false);
        });

        it('should reject incorrect length', () => {
            expect(isValidPin('12345')).toBe(false);
            expect(isValidPin('1234567')).toBe(false);
        });
    });

    describe('isValidAmount', () => {
        it('should accept valid amounts', () => {
            expect(isValidAmount(1)).toBe(true);
            expect(isValidAmount(1000)).toBe(true);
            expect(isValidAmount(1000000)).toBe(true);
        });

        it('should reject zero and negative amounts by default', () => {
            expect(isValidAmount(0)).toBe(false);
            expect(isValidAmount(-100)).toBe(false);
        });

        it('should respect minimum constraint', () => {
            expect(isValidAmount(100, 1000)).toBe(false);
            expect(isValidAmount(1000, 1000)).toBe(true);
        });

        it('should respect maximum constraint', () => {
            expect(isValidAmount(10000, 1, 5000)).toBe(false);
            expect(isValidAmount(5000, 1, 5000)).toBe(true);
        });

        it('should reject invalid types', () => {
            expect(isValidAmount('1000' as any)).toBe(false);
            expect(isValidAmount(Infinity)).toBe(false);
            expect(isValidAmount(NaN)).toBe(false);
        });
    });

    describe('isValidTopUpAmount', () => {
        it('should accept amount between Rp10.000 and Rp10.000.000', () => {
            expect(isValidTopUpAmount(10000)).toBe(true);
            expect(isValidTopUpAmount(500000)).toBe(true);
            expect(isValidTopUpAmount(10000000)).toBe(true);
        });

        it('should reject amount below minimum', () => {
            expect(isValidTopUpAmount(5000)).toBe(false);
            expect(isValidTopUpAmount(9999)).toBe(false);
        });

        it('should reject amount above maximum', () => {
            expect(isValidTopUpAmount(10000001)).toBe(false);
            expect(isValidTopUpAmount(20000000)).toBe(false);
        });
    });
});
