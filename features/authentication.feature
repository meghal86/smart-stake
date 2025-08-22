Feature: User Authentication
  As a user
  I want to be able to sign up and log in
  So that I can access whale tracking features

  Background:
    Given I am on the whale tracking application

  Scenario: User signs up with email and password
    Given I am on the signup page
    When I enter a valid email address
    And I enter a strong password
    And I confirm my password
    And I accept the terms and conditions
    And I click the "Create Account" button
    Then I should see a success message
    And I should be redirected to the login page

  Scenario: User signs up with Google OAuth
    Given I am on the signup page
    When I click the "Continue with Google" button
    Then I should be redirected to Google's authentication page
    And after successful authentication, I should be logged in

  Scenario: User signs up with Apple OAuth
    Given I am on the signup page
    When I click the "Continue with Apple" button
    Then I should be redirected to Apple's authentication page
    And after successful authentication, I should be logged in

  Scenario: User logs in with email and password
    Given I am on the login page
    And I have an existing account
    When I enter my email address
    And I enter my password
    And I click the "Sign In" button
    Then I should be logged in successfully
    And I should be redirected to the home page

  Scenario: User logs in with Google OAuth
    Given I am on the login page
    When I click the "Continue with Google" button
    Then I should be redirected to Google's authentication page
    And after successful authentication, I should be logged in

  Scenario: User logs in with Apple OAuth
    Given I am on the login page
    When I click the "Continue with Apple" button
    Then I should be redirected to Apple's authentication page
    And after successful authentication, I should be logged in

  Scenario: User enters invalid credentials
    Given I am on the login page
    When I enter an invalid email address
    And I enter an incorrect password
    And I click the "Sign In" button
    Then I should see an error message
    And I should remain on the login page

  Scenario: User requests password reset
    Given I am on the login page
    When I enter my email address
    And I click the "Forgot password?" link
    Then I should see a confirmation message
    And I should receive a password reset email

  Scenario: Password validation during signup
    Given I am on the signup page
    When I enter a weak password
    Then I should see password requirements
    And the requirements should show which criteria are not met
    When I enter a strong password
    Then all password requirements should be satisfied

  Scenario: Terms and conditions validation
    Given I am on the signup page
    When I fill out all required fields
    But I do not accept the terms and conditions
    And I click the "Create Account" button
    Then I should see an error message about accepting terms
    And the account should not be created