Feature: Portfolio Monitoring
  As a crypto investor
  I want to monitor multiple wallet addresses
  So that I can track portfolio performance and whale interactions

  Background:
    Given I am logged into WhalePlus
    And I am on the portfolio monitor page

  @smoke @portfolio
  Scenario: Add first wallet address
    Given I have no addresses in my portfolio
    When I click the "Add Address" button
    And I enter a valid Ethereum address "0x742d35Cc6634C0532925a3b8D4C9db4C532925a3"
    And I enter the label "My Trading Wallet"
    And I select group "Personal Wallets"
    And I click "Add Address"
    Then I should see the address added to my portfolio
    And I should see the address label "My Trading Wallet"
    And I should see the group tag "personal"
    And I should see portfolio summary updated

  @portfolio @validation
  Scenario: Add address with ENS name
    When I click the "Add Address" button
    And I enter ENS name "vitalik.eth"
    And I enter the label "Vitalik's Wallet"
    And I click "Add Address"
    Then I should see the address added successfully
    And I should see "Vitalik's Wallet" in the portfolio

  @portfolio @validation
  Scenario: Validate invalid address format
    When I click the "Add Address" button
    And I enter invalid address "invalid-address"
    And I enter the label "Test Wallet"
    Then I should see validation error "Please enter a valid Ethereum address or ENS name"
    And the "Add Address" button should be disabled

  @portfolio @data
  Scenario: View portfolio summary
    Given I have 3 addresses in my portfolio
    When I view the portfolio summary
    Then I should see total portfolio value
    And I should see average P&L percentage
    And I should see monitored addresses count "3"
    And I should see 24h trend indicators

  @portfolio @filtering
  Scenario: Filter addresses by risk level
    Given I have addresses with different risk scores
    When I select filter "High Risk"
    Then I should only see addresses with risk score <= 3
    And the address count should update accordingly

  @portfolio @filtering
  Scenario: Filter addresses by group tag
    Given I have addresses in different groups
    When I select filter "Personal"
    Then I should only see addresses tagged as "personal"
    And other group addresses should be hidden

  @portfolio @sorting
  Scenario: Sort addresses by portfolio value
    Given I have multiple addresses with different values
    When I select sort by "Value"
    Then addresses should be ordered from highest to lowest value
    And the highest value address should appear first

  @portfolio @sorting
  Scenario: Sort addresses by P&L performance
    Given I have addresses with different P&L percentages
    When I select sort by "P&L"
    Then addresses should be ordered by performance
    And profitable addresses should appear before losing ones

  @portfolio @export
  Scenario: Export portfolio data to CSV
    Given I have addresses in my portfolio
    When I click the "Export" button
    Then a CSV file should be downloaded
    And the file should contain address labels, values, and P&L data
    And the filename should include current date

  @portfolio @details
  Scenario: View address details and holdings
    Given I have an address with token holdings
    When I click the expand button on an address card
    Then I should see detailed holdings breakdown
    And I should see individual token balances
    And I should see token value changes

  @portfolio @external
  Scenario: Open address in blockchain explorer
    Given I have an address in my portfolio
    When I click the "Explorer" link
    Then a new tab should open with Etherscan
    And the correct address should be displayed

  @portfolio @management
  Scenario: Remove address from portfolio
    Given I have an address in my portfolio
    When I click the delete button on the address card
    Then the address should be removed from portfolio
    And the portfolio summary should update
    And the address count should decrease

  @portfolio @pagination
  Scenario: Navigate through paginated addresses
    Given I have more than 5 addresses in my portfolio
    When I view the address list
    Then I should see pagination controls
    And I should see "1 of X" page indicator
    When I click "Next"
    Then I should see the next set of addresses

  @portfolio @mobile
  Scenario: Use mobile floating add button
    Given I am on a mobile device
    When I scroll down the portfolio page
    Then I should see a floating "Add Address" button
    When I click the floating button
    Then the add address modal should open

  @portfolio @tooltips
  Scenario: View risk score explanation
    Given I have an address with a risk score
    When I hover over the risk badge
    Then I should see a tooltip explaining risk calculation
    And the tooltip should mention transaction patterns and volatility

  @portfolio @tooltips
  Scenario: View whale interactions explanation
    Given I have an address with whale interactions
    When I hover over the whale interactions field
    Then I should see a tooltip explaining whale detection
    And the tooltip should mention ">$1M in assets"

  @portfolio @api @error
  Scenario: Handle API service unavailable
    Given the portfolio API service is down
    When I try to load portfolio data
    Then I should see error message "Portfolio tracking service is not deployed"
    And I should see a retry button
    When I click retry
    Then the system should attempt to reload data

  @portfolio @performance
  Scenario: Load portfolio with many addresses
    Given I have 20 addresses in my portfolio
    When I load the portfolio page
    Then the page should load within 3 seconds
    And pagination should be automatically applied
    And I should see 5 addresses per page

  @portfolio @persistence
  Scenario: Portfolio data persistence
    Given I have added addresses to my portfolio
    When I refresh the page
    Then my addresses should still be visible
    And all labels and groups should be preserved

  @portfolio @realtime
  Scenario: Real-time data updates
    Given I have addresses in my portfolio
    When I click the refresh button
    Then portfolio values should update
    And I should see loading indicators during refresh
    And updated timestamps should reflect current time