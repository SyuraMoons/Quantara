// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StartupToken} from "./StartupToken.sol";

/// @title MockBondingCurve
/// @notice Simulates RobinPump's bonding curve on Base Sepolia for hackathon demo
/// @dev Implements the same interface as IRobinPumpCurve so RobinLensRouter works unchanged
contract MockBondingCurve {
    StartupToken public immutable token;

    bool public trading = true;
    uint256 public constant FEE_PERCENT = 100; // 1%

    // Linear bonding curve parameters
    uint256 public constant BASE_PRICE = 0.0001 ether; // starting price per token
    uint256 public constant PRICE_INCREMENT = 1e6; // price goes up per token minted (in wei per 1e18 tokens)

    uint256 public ethCollected; // total ETH in the curve reserve

    // --- Events (matching RobinPump for subgraph compatibility) ---
    event Buy(
        address indexed buyer,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 price
    );
    event Sell(
        address indexed seller,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 price
    );

    // --- Errors ---
    error TradingNotActive();
    error SlippageExceeded();
    error DeadlineExpired();
    error InsufficientReserve();
    error ZeroAmount();

    constructor(address _token) {
        token = StartupToken(_token);
    }

    /// @notice Buy tokens by sending ETH
    /// @param minTokensOut Minimum tokens to receive (slippage protection)
    /// @param deadline Unix timestamp deadline
    function buy(uint256 minTokensOut, uint256 deadline) external payable {
        if (!trading) revert TradingNotActive();
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (msg.value == 0) revert ZeroAmount();

        // Calculate fee (1%)
        uint256 fee = (msg.value * FEE_PERCENT) / 10000;
        uint256 ethForTokens = msg.value - fee;

        // Calculate tokens out based on current supply and curve
        uint256 tokensOut = _calculateTokensForEth(ethForTokens);
        if (tokensOut < minTokensOut) revert SlippageExceeded();

        // Update state
        ethCollected += ethForTokens;

        // Mint tokens to buyer
        token.mint(msg.sender, tokensOut);

        emit Buy(msg.sender, msg.value, tokensOut, getCurrentPrice());
    }

    /// @notice Sell tokens back to the curve for ETH
    /// @param tokensToSell Amount of tokens to sell
    /// @param minEthOut Minimum ETH to receive (slippage protection)
    /// @param deadline Unix timestamp deadline
    function sell(
        uint256 tokensToSell,
        uint256 minEthOut,
        uint256 deadline
    ) external {
        if (!trading) revert TradingNotActive();
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (tokensToSell == 0) revert ZeroAmount();

        // Calculate ETH to return
        uint256 ethOut = _calculateEthForTokens(tokensToSell);

        // Apply fee (1%)
        uint256 fee = (ethOut * FEE_PERCENT) / 10000;
        uint256 ethAfterFee = ethOut - fee;

        if (ethAfterFee < minEthOut) revert SlippageExceeded();
        if (ethAfterFee > address(this).balance) revert InsufficientReserve();

        // Burn tokens from seller (requires the seller to have approved this contract or
        // the router to have transferred tokens to itself first, then approved this contract)
        token.burn(msg.sender, tokensToSell);

        // Update state — cap to available balance (price curve can cause ethOut > ethCollected)
        ethCollected = ethOut > ethCollected ? 0 : ethCollected - ethOut;

        // Send ETH to seller
        (bool success, ) = msg.sender.call{value: ethAfterFee}("");
        require(success, "ETH transfer failed");

        emit Sell(msg.sender, tokensToSell, ethAfterFee, getCurrentPrice());
    }

    // --- View Functions (matching IRobinPumpCurve interface) ---

    /// @notice Get current token price in ETH (per 1 full token)
    function getCurrentPrice() public view returns (uint256) {
        uint256 supply = token.totalSupply();
        return BASE_PRICE + (supply * PRICE_INCREMENT) / 1e18;
    }

    /// @notice Estimate tokens received for a given ETH amount
    function getTokensForEth(
        uint256 ethAmount
    ) external view returns (uint256) {
        uint256 fee = (ethAmount * FEE_PERCENT) / 10000;
        return _calculateTokensForEth(ethAmount - fee);
    }

    // --- Internal Math ---

    /// @dev Calculate tokens out for ETH in (linear curve approximation)
    /// Uses the average price across the buy range
    function _calculateTokensForEth(
        uint256 ethAmount
    ) internal view returns (uint256) {
        uint256 currentPrice = getCurrentPrice();
        if (currentPrice == 0) return 0;

        // Simple linear: tokens = ethAmount / currentPrice
        // This is an approximation — good enough for a demo
        return (ethAmount * 1e18) / currentPrice;
    }

    /// @dev Calculate ETH out for tokens sold
    function _calculateEthForTokens(
        uint256 tokenAmount
    ) internal view returns (uint256) {
        uint256 currentPrice = getCurrentPrice();
        return (tokenAmount * currentPrice) / 1e18;
    }

    /// @dev Accept ETH directly (for initial funding)
    receive() external payable {}
}
