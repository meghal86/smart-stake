/**
 * Settings Schema Tests
 * 
 * Tests for the Settings validation schemas
 * Requirements: R5.SETTINGS.NO_INVALID_PLACEHOLDERS, R5.SETTINGS.CLEAR_EXPLANATIONS
 */

import { describe, test, expect } from 'vitest';
import { profileSettingsSchema } from '../settings';

describe('Settings Schema Validation', () => {
  test('validates correct profile data', () => {
    const validData = {
      fullName: 'John Doe',
      email: 'john@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
      dateOfBirth: '1990-01-01',
      phoneNumber: '+1234567890',
    };
    
    const result = profileSettingsSchema.safeParse(validData);
    
    if (!result.success) {
      console.log('Validation errors:', result.error.issues);
    }
    
    expect(result.success).toBe(true);
  });

  test('allows empty optional fields', () => {
    const minimalData = {
      email: 'john@example.com',
    };
    
    const result = profileSettingsSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
  });

  test('validates phone numbers correctly', () => {
    const testCases = [
      { phone: '+1234567890', shouldPass: true },
      { phone: '1234567890', shouldPass: true },
      { phone: '+12345678901234', shouldPass: true },
      { phone: '123', shouldPass: false },
      { phone: 'abc1234567', shouldPass: false },
    ];

    testCases.forEach(({ phone, shouldPass }) => {
      const data = {
        email: 'test@example.com',
        phoneNumber: phone,
      };
      
      const result = profileSettingsSchema.safeParse(data);
      
      if (result.success !== shouldPass) {
        console.log(`Phone ${phone} - Expected: ${shouldPass}, Got: ${result.success}`);
        if (!result.success) {
          console.log('Errors:', result.error.issues);
        }
      }
      
      expect(result.success).toBe(shouldPass);
    });
  });

  test('rejects invalid email', () => {
    const invalidData = {
      email: 'invalid-email',
    };
    
    const result = profileSettingsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(issue => issue.path.includes('email'))).toBe(true);
  });

  test('rejects future dates', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    const data = {
      email: 'john@example.com',
      dateOfBirth: futureDate.toISOString().split('T')[0],
    };
    
    const result = profileSettingsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});