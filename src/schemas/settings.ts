/**
 * Settings Form Validation Schemas
 * 
 * Zod schemas for validating user settings forms
 * Requirements: R5.SETTINGS.NO_INVALID_PLACEHOLDERS, R5.SETTINGS.CLEAR_EXPLANATIONS
 */

import { z } from 'zod';

/**
 * Profile settings schema
 */
export const profileSettingsSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  
  avatarUrl: z.string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  
  dateOfBirth: z.string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val || val === '') return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date < new Date();
      },
      'Please enter a valid date in the past'
    ),
  
  phoneNumber: z.string()
    .regex(/^(\+\d{1,3}[- ]?)?\d{7,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
});

/**
 * Notification settings schema
 */
export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyDigest: z.boolean(),
  marketingEmails: z.boolean(),
});

/**
 * Privacy settings schema
 */
export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends']),
  showEmail: z.boolean(),
  showActivity: z.boolean(),
});

/**
 * Security settings schema (V1.1 - MEV Protection)
 */
export const securitySettingsSchema = z.object({
  mevProtectedMode: z.enum(['off', 'auto', 'force']),
});

/**
 * Combined settings schema
 */
export const settingsSchema = z.object({
  profile: profileSettingsSchema,
  notifications: notificationSettingsSchema,
  privacy: privacySettingsSchema,
  security: securitySettingsSchema,
});

/**
 * Type exports
 */
export type ProfileSettings = z.infer<typeof profileSettingsSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type PrivacySettings = z.infer<typeof privacySettingsSchema>;
export type SecuritySettings = z.infer<typeof securitySettingsSchema>;
export type Settings = z.infer<typeof settingsSchema>;
