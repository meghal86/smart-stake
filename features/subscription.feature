Feature: Subscription Management
  As a user
  I want to subscribe to premium plans
  So that I can access advanced whale tracking features

  Background:
    Given I am logged in to the application

  Scenario: User views subscription plans
    Given I am on the subscription page
    Then I should see the "Free" plan
    And I should see the "Premium Monthly" plan
    And I should see the "Premium Annual" plan
    And each plan should display its features and pricing

  Scenario: User subscribes to Premium Monthly plan
    Given I am on the subscription page
    When I select the "Premium Monthly" plan
    And I click the "Subscribe Now" button
    Then I should be redirected to Stripe checkout
    And I should see the correct plan details
    When I complete the payment successfully
    Then I should be redirected to the success page
    And my account should be upgraded to premium

  Scenario: User subscribes to Premium Annual plan
    Given I am on the subscription page
    When I select the "Premium Annual" plan
    And I click the "Subscribe Now" button
    Then I should be redirected to Stripe checkout
    And I should see the annual billing details
    When I complete the payment successfully
    Then I should be redirected to the success page
    And my account should be upgraded to premium

  Scenario: User selects Free plan
    Given I am on the subscription page
    When I select the "Free" plan
    And I click the "Get Started Free" button
    Then my account should be set to the free plan
    And I should be redirected to the home page

  Scenario: Payment fails during checkout
    Given I am on the subscription page
    When I select a premium plan
    And I proceed to checkout
    And the payment fails
    Then I should see an error message
    And my account should remain unchanged

  Scenario: User cancels during checkout
    Given I am on the subscription page
    When I select a premium plan
    And I proceed to checkout
    And I cancel the payment process
    Then I should be redirected back to the subscription page
    And my account should remain unchanged

  Scenario: Unauthenticated user tries to subscribe
    Given I am not logged in
    When I visit the subscription page
    And I try to subscribe to a premium plan
    Then I should be redirected to the login page

  Scenario: Subscription webhook processing
    Given a user has completed a payment
    When Stripe sends a webhook notification
    Then the user's subscription status should be updated
    And the user should have access to premium features

  Scenario: Subscription renewal
    Given a user has an active premium subscription
    When the subscription period ends
    And the payment is processed successfully
    Then the subscription should be renewed automatically
    And the user should continue to have premium access

  Scenario: Failed subscription renewal
    Given a user has an active premium subscription
    When the subscription period ends
    And the payment fails
    Then the subscription status should be updated to "past_due"
    And the user should receive a notification about the failed payment