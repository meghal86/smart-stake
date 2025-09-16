Feature: Multi-Channel Notification System
  As a whale tracker user
  I want to receive notifications through multiple channels
  So that I never miss important whale alerts

  Background:
    Given the notification system is deployed
    And the database tables are created
    And API keys are configured

  Scenario: Email notification delivery
    Given a user with email "test@example.com" exists
    And email notifications are enabled for the user
    When a whale alert is triggered
    Then an email notification should be sent
    And the delivery should be logged in notification_logs
    And the delivery status should be "success"

  Scenario: Push notification delivery
    Given a user has registered for push notifications
    And push notifications are enabled for the user
    When a whale alert is triggered
    Then a push notification should be sent
    And the delivery should be logged in notification_logs
    And the delivery status should be "success"

  Scenario: User notification preferences
    Given a user is logged in
    When they access notification settings
    Then they should see email, SMS, and push options
    And they should be able to toggle each option
    And preferences should be saved to the database

  Scenario: Notification delivery tracking
    Given notifications have been sent
    When a user views the alert channels dashboard
    Then they should see delivery statistics
    And success rates for each channel
    And recent notification history

  Scenario: Failed notification handling
    Given an invalid email address
    When a notification is attempted
    Then the failure should be logged
    And the system should continue with other channels
    And retry logic should be applied