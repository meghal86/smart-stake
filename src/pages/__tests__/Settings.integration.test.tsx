/**
 * Settings Integration Tests
 * 
 * Integration tests for the Settings page component
 * Requirements: R5.SETTINGS.NO_INVALID_PLACEHOLDERS, R5.SETTINGS.CLEAR_EXPLANATIONS
 */

import { describe, test, expect } from 'vitest';
import { profileSettingsSchema } from '@/schemas/settings';

describe('Settings Page Integration', () => {
  test('Settings schema validation works correctly', () => {
    // Valid data should pass
    const validData = {
      fullName: 'John Doe',
      email: 'john@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
      dateOfBirth: '1990-01-01',
      phoneNumber: '+1234567890',
    };
    
    const result = profileSettingsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('Settings schema rejects invalid data', () => {
    // Invalid email should fail
    const invalidData = {
      fullName: 'John Doe',
      email: 'invalid-email',
      avatarUrl: 'not-a-url',
      dateOfBirth: 'invalid-date',
      phoneNumber: 'invalid-phone',
    };
    
    const result = profileSettingsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
      expect(result.error.issues.some(issue => issue.path.includes('email'))).toBe(true);
    }
  });

  test('Settings schema handles empty optional fields correctly', () => {
    // Empty optional fields should be allowed
    const dataWithEmptyFields = {
      fullName: '',
      email: 'john@example.com',
      avatarUrl: '',
      dateOfBirth: '',
      phoneNumber: '',
    };
    
    const result = profileSettingsSchema.safeParse(dataWithEmptyFields);
    expect(result.success).toBe(true);
  });

  test('Date validation prevents future dates', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    const dataWithFutureDate = {
      fullName: 'John Doe',
      email: 'john@example.com',
      dateOfBirth: futureDate.toISOString().split('T')[0],
    };
    
    const result = profileSettingsSchema.safeParse(dataWithFutureDate);
    expect(result.success).toBe(false);
  });

  test('Phone number validation works correctly', () => {
    const validPhones = ['+1234567890', '1234567890'];
    const invalidPhones = ['123', 'abc1234567', '123-456-789'];
    
    validPhones.forEach(phone => {
      const result = profileSettingsSchema.safeParse({
        email: 'test@example.com',
        phoneNumber: phone,
      });
      expect(result.success).toBe(true);
    });
    
    invalidPhones.forEach(phone => {
      const result = profileSettingsSchema.safeParse({
        email: 'test@example.com',
        phoneNumber: phone,
      });
      expect(result.success).toBe(false);
    });
  });
});