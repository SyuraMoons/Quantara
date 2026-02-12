// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RobinLensRouter} from "../src/RobinLensRouter.sol";
import {StartupToken} from "../src/StartupToken.sol";
import {MockBondingCurve} from "../src/MockBondingCurve.sol";

/// @title RobinLensRouter Tests
/// @notice Unit tests + E2E integration tests with real StartupToken and MockBondingCurve
contract RobinLensRouterTest is Test {
    RobinLensRouter public router;
    StartupToken public token;
    MockBondingCurve public curve;

    address public user = makeAddr("user");
    address public user2 = makeAddr("user2");

    function setUp() public {
        // Deploy the full stack (same as Deploy.s.sol)
        token = new StartupToken("EasyHack", "EHACK");
        curve = new MockBondingCurve(address(token));
        token.setCurve(address(curve));
        router = new RobinLensRouter();

        vm.deal(user, 100 ether);
        vm.deal(user2, 100 ether);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Unit Tests — Router validation
    // ──────────────────────────────────────────────────────────────────────────

    function test_buyToken_revertsOnZeroValue() public {
        vm.prank(user);
        vm.expectRevert(RobinLensRouter.ZeroAmount.selector);
        router.buyToken(address(curve), 0, block.timestamp + 300);
    }

    function test_buyToken_revertsOnExpiredDeadline() public {
        vm.prank(user);
        vm.expectRevert(RobinLensRouter.DeadlineExpired.selector);
        router.buyToken{value: 0.1 ether}(
            address(curve),
            0,
            block.timestamp - 1
        );
    }

    function test_sellToken_revertsOnZeroAmount() public {
        vm.prank(user);
        vm.expectRevert(RobinLensRouter.ZeroAmount.selector);
        router.sellToken(
            address(curve),
            address(token),
            0,
            0,
            block.timestamp + 300
        );
    }

    function test_sellToken_revertsOnExpiredDeadline() public {
        vm.prank(user);
        vm.expectRevert(RobinLensRouter.DeadlineExpired.selector);
        router.sellToken(
            address(curve),
            address(token),
            1e18,
            0,
            block.timestamp - 1
        );
    }

    function test_multiBuy_revertsOnArrayMismatch() public {
        address[] memory curves = new address[](2);
        uint256[] memory amounts = new uint256[](1);
        uint256[] memory minOuts = new uint256[](2);

        vm.prank(user);
        vm.expectRevert(RobinLensRouter.ArrayLengthMismatch.selector);
        router.multiBuy{value: 1 ether}(
            curves,
            amounts,
            minOuts,
            block.timestamp + 300
        );
    }

    function test_multiBuy_revertsOnInsufficientEth() public {
        address[] memory curves = new address[](2);
        curves[0] = address(curve);
        curves[1] = address(curve);

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1 ether;
        amounts[1] = 1 ether;

        uint256[] memory minOuts = new uint256[](2);

        vm.prank(user);
        vm.expectRevert(RobinLensRouter.InsufficientEthSent.selector);
        router.multiBuy{value: 1 ether}(
            curves,
            amounts,
            minOuts,
            block.timestamp + 300
        );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // View Function Tests
    // ──────────────────────────────────────────────────────────────────────────

    function test_quoteBuy() public view {
        uint256 quote = router.quoteBuy(address(curve), 1 ether);
        assertGt(quote, 0, "Quote should be > 0");
    }

    function test_getPrice() public view {
        uint256 price = router.getPrice(address(curve));
        assertEq(price, 0.0001 ether, "Initial price should be BASE_PRICE");
    }

    function test_isTradingActive() public view {
        assertTrue(router.isTradingActive(address(curve)));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // E2E Tests — Full buy/sell flow with real contracts
    // ──────────────────────────────────────────────────────────────────────────

    function test_e2e_buyTokensViaRouter() public {
        uint256 ethToSpend = 0.1 ether;

        vm.prank(user);
        router.buyToken{value: ethToSpend}(
            address(curve),
            0,
            block.timestamp + 300
        );

        // User should have received EasyHack tokens
        uint256 tokenBalance = token.balanceOf(user);
        assertGt(tokenBalance, 0, "User should have tokens after buy");

        // Token supply should have increased
        assertGt(token.totalSupply(), 0, "Total supply should increase");
    }

    function test_e2e_sellTokensViaRouter() public {
        // First: buy some tokens
        vm.prank(user);
        router.buyToken{value: 1 ether}(
            address(curve),
            0,
            block.timestamp + 300
        );

        uint256 tokenBalance = token.balanceOf(user);
        assertGt(tokenBalance, 0, "Should have tokens to sell");

        // Approve router to spend tokens
        vm.prank(user);
        token.approve(address(router), tokenBalance);

        uint256 ethBefore = user.balance;

        // Sell half the tokens
        uint256 tokensToSell = tokenBalance / 2;
        vm.prank(user);
        router.sellToken(
            address(curve),
            address(token),
            tokensToSell,
            0,
            block.timestamp + 300
        );

        // User should have received ETH back
        assertGt(
            user.balance,
            ethBefore,
            "User should have more ETH after sell"
        );

        // User should have remaining tokens
        assertEq(
            token.balanceOf(user),
            tokenBalance - tokensToSell,
            "Remaining tokens should match"
        );
    }

    function test_e2e_priceIncreasesWithSupply() public {
        uint256 priceBefore = curve.getCurrentPrice();

        // Buy tokens to increase supply
        vm.prank(user);
        router.buyToken{value: 5 ether}(
            address(curve),
            0,
            block.timestamp + 300
        );

        uint256 priceAfter = curve.getCurrentPrice();
        assertGt(priceAfter, priceBefore, "Price should increase after buying");
    }

    function test_e2e_multiBuySameToken() public {
        // Simulate AI recommending the same token multiple times (dollar-cost averaging)
        address[] memory curves = new address[](3);
        curves[0] = address(curve);
        curves[1] = address(curve);
        curves[2] = address(curve);

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 0.1 ether;
        amounts[1] = 0.2 ether;
        amounts[2] = 0.15 ether;

        uint256[] memory minOuts = new uint256[](3);

        uint256 totalEth = 0.45 ether;

        vm.prank(user);
        router.multiBuy{value: 1 ether}(
            curves,
            amounts,
            minOuts,
            block.timestamp + 300
        );

        // User should have tokens
        assertGt(token.balanceOf(user), 0, "Should have tokens from multi-buy");

        // Excess ETH should be refunded (sent 1 ETH, only needed 0.45)
        assertGe(
            user.balance,
            100 ether - totalEth - 0.01 ether,
            "Excess ETH should be refunded"
        );
    }

    function test_e2e_fullCycle() public {
        // === Full demo flow ===
        // 1. User buys via router
        vm.prank(user);
        router.buyToken{value: 0.5 ether}(
            address(curve),
            0,
            block.timestamp + 300
        );
        uint256 tokensReceived = token.balanceOf(user);
        assertGt(tokensReceived, 0, "Step 1: Should receive tokens");

        // 2. Price should have moved up
        uint256 priceAfterBuy = curve.getCurrentPrice();
        assertGt(
            priceAfterBuy,
            0.0001 ether,
            "Step 2: Price should be above base"
        );

        // 3. User sells everything
        vm.startPrank(user);
        token.approve(address(router), tokensReceived);
        uint256 ethBefore = user.balance;
        router.sellToken(
            address(curve),
            address(token),
            tokensReceived,
            0,
            block.timestamp + 300
        );
        vm.stopPrank();

        // 4. Verify sell worked
        assertEq(
            token.balanceOf(user),
            0,
            "Step 4: Should have 0 tokens after full sell"
        );
        assertGt(
            user.balance,
            ethBefore,
            "Step 4: Should have received ETH back"
        );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // StartupToken Tests
    // ──────────────────────────────────────────────────────────────────────────

    function test_token_nameAndSymbol() public view {
        assertEq(token.name(), "EasyHack");
        assertEq(token.symbol(), "EHACK");
        assertEq(token.decimals(), 18);
    }

    function test_token_onlyCurveCanMint() public {
        vm.prank(user);
        vm.expectRevert(StartupToken.Unauthorized.selector);
        token.mint(user, 1000 ether);
    }

    function test_token_onlyCurveCanBurn() public {
        vm.prank(user);
        vm.expectRevert(StartupToken.Unauthorized.selector);
        token.burn(user, 1000 ether);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // MockBondingCurve Tests
    // ──────────────────────────────────────────────────────────────────────────

    function test_curve_directBuy() public {
        vm.prank(user);
        curve.buy{value: 0.1 ether}(0, block.timestamp + 300);

        assertGt(token.balanceOf(user), 0, "Should have tokens");
        assertGt(curve.ethCollected(), 0, "Curve should have ETH");
    }

    function test_curve_tradingFlag() public view {
        assertTrue(curve.trading());
        assertEq(curve.FEE_PERCENT(), 100); // 1%
    }

    function test_receive_acceptsEth() public {
        vm.prank(user);
        (bool success, ) = address(router).call{value: 1 ether}("");
        assertTrue(success);
    }
}
