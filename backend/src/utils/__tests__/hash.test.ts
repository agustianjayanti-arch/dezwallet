import { hashPassword, compareHash } from '../hash';

describe('Hash Utils', () => {
    describe('hashPassword', () => {
        it('should hash password and return different value', async () => {
            const password = 'testPassword123';
            const hash = await hashPassword(password);

            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(password.length);
        });

        it('should produce different hash for same password', async () => {
            const password = 'testPassword123';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);

            expect(hash1).not.toBe(hash2);
        });

        it('should hash various passwords', async () => {
            const passwords = [
                'shortPassword8',
                'VeryLongPasswordWithManyCharacters123!@#',
                '12345678',
            ];

            for (const password of passwords) {
                const hash = await hashPassword(password);
                expect(hash).not.toBe(password);
                expect(hash).toBeTruthy();
            }
        });
    });

    describe('compareHash', () => {
        it('should return true for matching password and hash', async () => {
            const password = 'testPassword123';
            const hash = await hashPassword(password);
            const isMatch = await compareHash(password, hash);

            expect(isMatch).toBe(true);
        });

        it('should return false for non-matching password', async () => {
            const password = 'testPassword123';
            const hash = await hashPassword(password);
            const isMatch = await compareHash('wrongPassword', hash);

            expect(isMatch).toBe(false);
        });

        it('should be case sensitive', async () => {
            const password = 'TestPassword123';
            const hash = await hashPassword(password);
            const isMatch = await compareHash('testpassword123', hash);

            expect(isMatch).toBe(false);
        });

        it('should handle multiple comparisons independently', async () => {
            const password1 = 'password1';
            const password2 = 'password2';
            const hash1 = await hashPassword(password1);
            const hash2 = await hashPassword(password2);

            expect(await compareHash(password1, hash1)).toBe(true);
            expect(await compareHash(password2, hash2)).toBe(true);
            expect(await compareHash(password1, hash2)).toBe(false);
            expect(await compareHash(password2, hash1)).toBe(false);
        });
    });
});
