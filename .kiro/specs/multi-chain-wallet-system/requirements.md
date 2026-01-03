# Multi-Chain EVM Wallet Enhancement Requirements (v2.3)

## Introduction

This specification enhances the existing AlphaWhale wallet system to support multiple EVM networks using CAIP-2 chain namespaces. The system builds upon the current WalletContext, WalletSelector, useWalletRegistry, and user_wallets infrastructure to add EVM multi-chain capabilities while maintaining backward compatibility. This version focuses on read-only portfolio aggregation and Guardian scanning across supported EVM networks.

## Glossary

- **WalletContext**: Existing React context managing multi-wallet state and switching
- **WalletSelector**: Existing UI component for wallet selection and management  
- **useWalletRegistry**: Existing hook for Supabase-backed wallet persistence
- **user_wallets**: Existing database table storing wallet registry data
- **CAIP_2**: Chain Agnostic Improvement Proposal for chain namespace standardization (chainId examples: eip155:1 for Ethereum mainnet)
- **EVM_Network**: Ethereum Virtual Machine compatible blockchain networks
- **Chain_Namespace**: CAIP-2 formatted chain identifier (e.g., eip155:1 for Ethereum mainnet)
- **Multi_Chain_Portfolio**: Enhanced portfolio aggregation across supported EVM networks
- **Network_Switcher**: Enhanced network detection and switching for EVM chains
- **Guardian_Multi_Scan**: Extended Guardian scanning across multiple EVM networks

## Requirements

### Requirement 1: EVM Network Support with CAIP-2

**User Story:** As a user, I want to connect and view wallets across multiple EVM networks, so that I can manage my assets on Ethereum, Polygon, Arbitrum, and other EVM chains.

#### Acceptance Criteria

1. THE user_wallets table SHALL store wallets using CAIP-2 chain_namespace format (supported: eip155:1 [Ethereum], eip155:137 [Polygon], eip155:42161 [Arbitrum], eip155:10 [Optimism], eip155:8453 [Base])
2. THE WalletContext SHALL support wallet connections across Ethereum mainnet, Polygon, Arbitrum, Optimism, and Base networks
3. THE WalletSelector SHALL display network badges for each supported EVM network
4. WHEN a user connects a wallet, THE useWalletRegistry SHALL detect and store the appropriate chain_namespace
5. THE existing RainbowKit integration SHALL continue to work while adding multi-network support

### Requirement 2: Multi-Chain Portfolio Aggregation

**User Story:** As a user, I want to see my portfolio aggregated across all connected EVM networks, so that I can get a complete view of my multi-chain assets.

#### Acceptance Criteria

1. THE Multi_Chain_Portfolio SHALL aggregate balances from Ethereum, Polygon, Arbitrum, Optimism, and Base networks
2. THE useWalletRegistry SHALL store cached balance data per chain_namespace for offline viewing
3. THE WalletSelector SHALL display network-specific balance indicators for each connected wallet
4. WHEN displaying portfolio data, THE Multi_Chain_Portfolio SHALL show both individual network balances and total USD value
5. THE Multi_Chain_Portfolio SHALL update balance data every 60 seconds for active sessions

### Requirement 3: Network Switching and Detection

**User Story:** As a user, I want to easily switch between different EVM networks and have the system automatically detect which networks my wallet supports.

#### Acceptance Criteria

1. THE Network_Switcher SHALL detect supported EVM networks for connected wallets
2. THE WalletSelector SHALL allow users to view the same wallet address across different EVM networks
3. THE WalletContext SHALL maintain network switching state and update the interface within 2 seconds
4. WHEN a user switches networks, THE Multi_Chain_Portfolio SHALL update to show network-specific data
5. THE Network_Switcher SHALL cache network detection results to improve performance

### Requirement 4: Multi-Chain Guardian Scanning

**User Story:** As a user, I want Guardian security scans to work across all my connected EVM networks, so that I can monitor security risks on all chains where I have assets.

#### Acceptance Criteria

1. THE Guardian_Multi_Scan SHALL extend existing Guardian scanning to support multiple EVM networks
2. THE useWalletRegistry SHALL store Guardian scan results per chain_namespace
3. THE WalletSelector SHALL display network-specific Guardian scores and risk indicators
4. WHEN Guardian scans complete, THE user_wallets table SHALL update trust_score and risk_flags per network
5. THE Guardian_Multi_Scan SHALL prioritize networks based on portfolio value and activity

### Requirement 5: Enhanced Security for Multi-Chain

**User Story:** As a user, I want my multi-chain EVM wallet connections to maintain the same security standards across all supported networks.

#### Acceptance Criteria

1. THE WalletContext SHALL extend existing security protocols to all supported EVM networks
2. THE useWalletRegistry SHALL never store or transmit private keys for any EVM network
3. THE user_wallets table SHALL maintain existing encryption standards for multi-chain data
4. THE WalletSelector SHALL provide clear security indicators for each EVM network
5. THE Network_Switcher SHALL validate network authenticity before allowing connections

### Requirement 6: Backward Compatibility

**User Story:** As an existing user, I want all my current Ethereum wallet connections and settings to continue working seamlessly when multi-chain EVM support is added.

#### Acceptance Criteria

1. THE WalletContext SHALL maintain compatibility with existing Ethereum wallet connections
2. THE useWalletRegistry SHALL migrate existing user_wallets data to use CAIP-2 chain_namespace format
3. THE WalletSelector SHALL display existing Ethereum wallets alongside new multi-chain wallets
4. WHEN upgrading to multi-chain support, THE user_wallets table SHALL preserve all existing wallet data and labels
5. THE existing RainbowKit integration SHALL continue to function without modification
6. Run one-time migration script: UPDATE user_wallets SET chain_namespace = 'eip155:1' WHERE chain_namespace IS NULL; Log migrations in audit table. Test: Existing Ethereum wallets appear with eip155:1 post-upgrade

### Requirement 7: Enhanced Multi-Chain User Interface

**User Story:** As a user, I want an intuitive interface for managing my EVM wallets across multiple networks, so that I can easily navigate between Ethereum, Polygon, Arbitrum, and other supported chains.

#### Acceptance Criteria

1. THE WalletSelector SHALL extend existing UI to display CAIP-2 network badges (Ethereum, Polygon, Arbitrum, Optimism, Base)
2. THE WalletSelector SHALL show the same wallet address across different EVM networks with clear network indicators
3. THE WalletSelector SHALL maintain existing accessibility features while adding multi-chain network support
4. THE WalletContext SHALL preserve existing wallet switching functionality and extend it to network switching
5. THE WalletSelector SHALL provide network-specific tooltips showing chain names and network status

### Requirement 8: Enhanced Error Handling for EVM Networks

**User Story:** As a user, I want clear feedback when multi-chain EVM operations fail, so that I can understand and resolve network-specific issues quickly.

#### Acceptance Criteria

1. THE WalletContext SHALL extend existing error handling to support EVM network-specific error messages
2. THE Network_Switcher SHALL provide standardized error codes for each supported EVM network: NETWORK_UNSUPPORTED (421), RPC_FAILURE (422), SWITCH_TIMEOUT (423)
3. THE WalletSelector SHALL display network-specific troubleshooting suggestions for connection issues
4. THE useWalletRegistry SHALL handle EVM network-specific RPC failures gracefully with fallback providers
5. THE Multi_Chain_Portfolio SHALL provide detailed error information for failed balance queries per network

### Requirement 9: Enhanced Performance for Multi-Chain

**User Story:** As a user, I want fast and reliable multi-chain EVM operations, so that I can view my portfolio and switch networks efficiently.

#### Acceptance Criteria

1. THE WalletContext SHALL maintain existing performance standards while adding EVM multi-chain support
2. THE Multi_Chain_Portfolio SHALL cache EVM network data to reduce cross-chain query times
3. THE Network_Switcher SHALL implement progressive loading for multi-chain portfolio data
4. THE Guardian_Multi_Scan SHALL batch EVM network scans to minimize API usage
5. THE useWalletRegistry SHALL optimize database queries for CAIP-2 chain_namespace lookups
6. Queries must complete in <500ms (p95); test with 100 wallets across 5 networks. Use indexes on (user_id, chain_namespace)

### Requirement 10: Extensible EVM Architecture

**User Story:** As a developer, I want a modular EVM multi-chain system that can be extended with new EVM networks, so that the platform can easily add support for new Layer 2s and EVM-compatible chains.

#### Acceptance Criteria

1. THE Network_Switcher SHALL provide a standardized interface for adding new EVM networks using CAIP-2 format
2. THE WalletContext SHALL support configuration-based addition of new EVM networks without code changes
3. THE user_wallets table SHALL accommodate new EVM networks through the existing CAIP-2 chain_namespace schema
4. THE useWalletRegistry SHALL automatically support new EVM networks when they are added to the configuration
5. THE WalletSelector SHALL dynamically display new EVM network badges as they are added to the supported networks list