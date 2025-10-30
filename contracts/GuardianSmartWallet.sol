// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GuardianSmartWallet
 * @dev Minimal smart contract wallet for Guardian automation
 */
contract GuardianSmartWallet is Ownable, ReentrancyGuard {
    
    struct AutomationPolicy {
        bool enabled;
        uint256 maxGasPrice;
        uint256 dailyLimit;
        uint256 dailyUsed;
        uint256 lastResetDay;
    }
    
    mapping(address => bool) public authorizedRelayers;
    mapping(address => AutomationPolicy) public userPolicies;
    
    event RelayerAuthorized(address indexed relayer, bool authorized);
    event AutomationExecuted(address indexed user, address indexed target, bytes4 selector, uint256 gasUsed);
    event PolicyUpdated(address indexed user, bool enabled, uint256 maxGasPrice, uint256 dailyLimit);
    
    modifier onlyAuthorizedRelayer() {
        require(authorizedRelayers[msg.sender], "Not authorized relayer");
        _;
    }
    
    constructor() {}
    
    function setRelayerAuthorization(address relayer, bool authorized) external onlyOwner {
        authorizedRelayers[relayer] = authorized;
        emit RelayerAuthorized(relayer, authorized);
    }
    
    function setAutomationPolicy(
        address user,
        bool enabled,
        uint256 maxGasPrice,
        uint256 dailyLimit
    ) external {
        require(msg.sender == user || msg.sender == owner(), "Not authorized");
        
        AutomationPolicy storage policy = userPolicies[user];
        policy.enabled = enabled;
        policy.maxGasPrice = maxGasPrice;
        policy.dailyLimit = dailyLimit;
        
        uint256 currentDay = block.timestamp / 86400;
        if (policy.lastResetDay != currentDay) {
            policy.dailyUsed = 0;
            policy.lastResetDay = currentDay;
        }
        
        emit PolicyUpdated(user, enabled, maxGasPrice, dailyLimit);
    }
    
    function executeAutomatedRevoke(
        address user,
        address target,
        bytes calldata data
    ) external onlyAuthorizedRelayer nonReentrant {
        AutomationPolicy storage policy = userPolicies[user];
        require(policy.enabled, "Automation disabled");
        require(tx.gasprice <= policy.maxGasPrice, "Gas price too high");
        
        uint256 currentDay = block.timestamp / 86400;
        if (policy.lastResetDay != currentDay) {
            policy.dailyUsed = 0;
            policy.lastResetDay = currentDay;
        }
        require(policy.dailyUsed < policy.dailyLimit, "Daily limit exceeded");
        
        // Verify it's a revoke operation
        require(data.length >= 68, "Invalid data length");
        bytes4 selector = bytes4(data[:4]);
        require(selector == IERC20.approve.selector, "Only approve operations allowed");
        
        uint256 amount;
        assembly {
            amount := calldataload(add(data.offset, 36))
        }
        require(amount == 0, "Only revoke (0 amount) allowed");
        
        uint256 gasStart = gasleft();
        (bool success, ) = target.call(data);
        require(success, "Revoke execution failed");
        
        uint256 gasUsed = gasStart - gasleft();
        policy.dailyUsed += 1;
        
        emit AutomationExecuted(user, target, selector, gasUsed);
    }
    
    receive() external payable {}
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}