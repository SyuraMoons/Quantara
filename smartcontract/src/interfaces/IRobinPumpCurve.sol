// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IRobinPumpCurve
/// @notice Interface for RobinPump bonding curve contracts on Base
/// @dev Reverse-engineered from on-chain RobinPump contracts
interface IRobinPumpCurve {
    /// @notice Buy tokens on the bonding curve by sending ETH
    /// @param minTokensOut Minimum tokens to receive (slippage protection)
    /// @param deadline Unix timestamp after which the tx reverts
    function buy(uint256 minTokensOut, uint256 deadline) external payable;

    /// @notice Sell tokens back to the bonding curve for ETH
    /// @param tokensToSell Amount of tokens to sell
    /// @param minEthOut Minimum ETH to receive (slippage protection)
    /// @param deadline Unix timestamp after which the tx reverts
    function sell(
        uint256 tokensToSell,
        uint256 minEthOut,
        uint256 deadline
    ) external;

    /// @notice Get the current token price in ETH
    /// @return Current price in wei per token
    function getCurrentPrice() external view returns (uint256);

    /// @notice Get the number of tokens for a given ETH amount
    /// @param ethAmount Amount of ETH in wei
    /// @return Number of tokens that would be received
    function getTokensForEth(uint256 ethAmount) external view returns (uint256);

    /// @notice Check if trading is active on this curve
    /// @return true if trading is enabled
    function trading() external view returns (bool);

    /// @notice Get the fee percentage charged by the curve
    /// @return Fee percentage
    function FEE_PERCENT() external view returns (uint256);
}
