// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title StartupToken
/// @notice Configurable ERC20 token for mock bonding curve demos on Base Sepolia
/// @dev Minting/burning controlled by the bonding curve contract
contract StartupToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public curve; // only the bonding curve can mint/burn
    address public owner;

    error Unauthorized();
    error InsufficientBalance();
    error InsufficientAllowance();

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event CurveSet(address indexed curve);

    modifier onlyCurve() {
        if (msg.sender != curve) revert Unauthorized();
        _;
    }

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
    }

    /// @notice Set the bonding curve address (one-time setup by owner)
    function setCurve(address _curve) external {
        if (msg.sender != owner) revert Unauthorized();
        curve = _curve;
        emit CurveSet(_curve);
    }

    /// @notice Mint tokens — only callable by the bonding curve
    function mint(address to, uint256 amount) external onlyCurve {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    /// @notice Burn tokens — only callable by the bonding curve
    function burn(address from, uint256 amount) external onlyCurve {
        if (balanceOf[from] < amount) revert InsufficientBalance();
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        if (balanceOf[msg.sender] < amount) revert InsufficientBalance();
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        if (allowance[from][msg.sender] < amount)
            revert InsufficientAllowance();
        if (balanceOf[from] < amount) revert InsufficientBalance();
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
