Feature: Predictions & Scenarios
  As a premium user
  I want to view AI-powered whale predictions with trust signals
  So that I can make informed trading decisions

  Background:
    Given I am logged in as a premium user
    And I navigate to the predictions page

  Scenario: View prediction outcomes with trust signals
    Given there are predictions with realized outcomes
    When I view the predictions list
    Then I should see outcome badges showing accuracy
    And outcome badges should display correct/incorrect status
    And outcome badges should show realized return percentages
    And tooltips should show measurement timestamps

  Scenario: Interact with confidence intervals
    Given there are predictions with confidence scores
    When I view a prediction card
    Then I should see a confidence bar instead of plain percentage
    And the confidence bar should show confidence intervals
    And hovering should display bootstrap CI information

  Scenario: Filter predictions by signal clusters
    Given there are multiple prediction clusters available
    When I click on a cluster card
    Then predictions should filter to show only cluster assets
    And the cluster card should highlight as selected
    And I should see a clear filter button
    When I click clear filter
    Then all predictions should be visible again

  Scenario: Create one-click alerts from predictions
    Given I am viewing a prediction
    When I click the "Alert" button
    Then an alert creation dialog should open
    And it should pre-populate with prediction details
    When I confirm the alert creation
    Then the alert should be created successfully
    And analytics should track the alert creation

  Scenario: Export prediction reports
    Given there are active predictions
    When I click "Export CSV"
    Then a CSV file should download with prediction data
    When I click "Export PDF"
    Then a PDF report should download with analysis

  Scenario: Access educational content
    Given I am viewing prediction details
    When I look for educational content
    Then I should see "Learn Why" tooltips
    And tooltips should explain whale volume impact
    And tooltips should have "Learn more" links

  Scenario: Mobile responsive behavior
    Given I am on a mobile device
    When I view the predictions page
    Then feature importance should collapse into accordion
    And I should see a floating action button for scenarios
    And tooltips should position correctly without blocking CTAs

  Scenario: Tier gating for premium features
    Given I am a free tier user
    When I try to create an alert from prediction
    Then I should see an upgrade prompt
    And I should be redirected to subscription page

  Scenario: Real-time prediction updates
    Given I am viewing the predictions page
    When new predictions are generated
    Then the page should auto-refresh every 30 seconds
    And new predictions should appear without page reload
    And loading states should be shown during updates