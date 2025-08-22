Feature: Whale Transaction Tracking
  As a user
  I want to track large cryptocurrency transactions
  So that I can make informed trading decisions

  Background:
    Given I am on the whale tracking application

  Scenario: User views whale alerts on home page
    Given I am on the home page
    Then I should see a list of whale transactions
    And each transaction should display:
      | Field | Description |
      | Amount | Transaction amount in USD |
      | Token | Cryptocurrency token |
      | Chain | Blockchain network |
      | Addresses | From and to addresses |
      | Timestamp | When the transaction occurred |
      | Type | Buy or sell indicator |

  Scenario: User searches for specific transactions
    Given I am on the home page
    When I enter "ETH" in the search box
    Then I should see only transactions involving ETH
    When I clear the search
    Then I should see all transactions again

  Scenario: User filters transactions by chain
    Given I am on the home page
    When I select "Ethereum" from the chain filter
    Then I should see only Ethereum transactions
    When I select "All Chains"
    Then I should see transactions from all chains

  Scenario: User filters transactions by minimum amount
    Given I am on the home page
    When I enter "1000000" in the minimum amount filter
    Then I should see only transactions above $1M
    When I clear the minimum amount filter
    Then I should see all transactions

  Scenario: User views transaction details
    Given I am on the home page
    When I click on a transaction
    Then I should see detailed transaction information
    And I should be able to view the transaction on the blockchain explorer

  Scenario: Demo data for unauthenticated users
    Given I am not logged in
    When I visit the home page
    Then I should see demo whale transactions
    And I should see a message indicating it's demo data
    And I should see a call-to-action to sign up

  Scenario: Real data for authenticated users
    Given I am logged in
    And there are real whale transactions available
    When I visit the home page
    Then I should see real whale transaction data
    And I should not see the demo data message

  Scenario: No transactions available
    Given I am on the home page
    And there are no transactions matching my filters
    Then I should see a "No Whale Activity" message
    And I should see suggestions to adjust my filters

  Scenario: Error handling for data fetching
    Given I am on the home page
    And there is a network error
    Then I should see an error message
    And I should have the option to retry
    When I click retry
    Then the system should attempt to fetch data again

  Scenario: Real-time updates for premium users
    Given I am a premium user
    And I am on the home page
    When new whale transactions occur
    Then I should see the new transactions appear automatically
    And I should receive real-time notifications

  Scenario: Limited alerts for free users
    Given I am a free user
    And I am on the home page
    Then I should see basic whale alerts
    But I should not receive real-time updates
    And I should see a message about premium features

  Scenario: Transaction amount formatting
    Given I am viewing whale transactions
    Then amounts should be formatted correctly:
      | Amount | Display |
      | 1500000 | 1.50M |
      | 950000 | 950K |
      | 2500000 | 2.50M |

  Scenario: Timestamp formatting
    Given I am viewing whale transactions
    Then timestamps should show relative time:
      | Time Ago | Display |
      | 5 minutes | 5m ago |
      | 2 hours | 2h ago |
      | 1 day | 1d ago |