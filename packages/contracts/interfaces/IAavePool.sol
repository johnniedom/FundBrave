// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

/**
 * @title IPool
 * @dev V3 interface for Aave Pool
 */
interface IAavePool {
    event Supply(
        address indexed reserve,
        address user,
        address indexed onBehalfOf,
        uint256 amount,
        uint16 indexed referralCode
    );
    event Withdraw(
        address indexed reserve,
        address indexed user,
        address indexed to,
        uint256 amount
    );
    event Borrow(
        address indexed reserve,
        address user,
        address indexed onBehalfOf,
        uint256 amount,
        uint8 interestRateMode,
        uint256 borrowRate,
        uint16 indexed referralCode
    );
    event Repay(
        address indexed reserve,
        address indexed user,
        address indexed repayer,
        uint256 amount,
        bool useATokens
    );

    /**
     * @dev Supplies an amount of a reserve asset to the pool, minting aTokens in return.
     * @param asset The address of the asset to supply
     * @param amount The amount to be supplied
     * @param onBehalfOf The address that will receive the aTokens
     * @param referralCode Code used to track referral distributions
     */
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    /**
     * @dev Withdraws an amount of a reserve asset from the pool, burning aTokens.
     * @param asset The address of the asset to withdraw
     * @param amount The amount to be withdrawn
     * @param to The address that will receive the underlying asset
     * @return The amount withdrawn
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);

    /**
     * @dev Borrows an amount of a reserve asset from the pool.
     * @param asset The address of the asset to borrow
     * @param amount The amount to be borrowed
     * @param interestRateMode The interest rate mode (1 for stable, 2 for variable)
     * @param referralCode Code used to track referral distributions
     * @param onBehalfOf The address that will receive the borrowed assets
     */
    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 referralCode,
        address onBehalfOf
    ) external;

    /**
     * @dev Repays a borrowed amount of a reserve asset.
     * @param asset The address of the asset to repay
     * @param amount The amount to be repaid
     * @param interestRateMode The interest rate mode (1 for stable, 2 for variable)
     * @param onBehalfOf The address on whose behalf the repayment is made
     * @return The amount repaid
     */
    function repay(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    ) external returns (uint256);

    /**
     * @dev Returns the configuration of a reserve.
     * @param asset The address of the reserve
     * @return The configuration data
     */
    function getReserveData(address asset)
        external
        view
        returns (
            uint256 configuration,
            uint128 liquidityIndex,
            uint128 variableBorrowIndex,
            uint128 currentLiquidityRate,
            uintax currentVariableBorrowRate,
            uint128 currentStableBorrowRate,
            uint40 lastUpdateTimestamp,
            address aTokenAddress,
            address stableDebtTokenAddress,
            address variableDebtTokenAddress,
            address interestRateStrategyAddress,
            uint8 id
        );

    /**
     * @dev Returns the address of the associated aToken for a reserve.
     * @param asset The address of the reserve
     * @return The address of the aToken
     */
    function getReserveATokenAddress(address asset)
        external
        view
        returns (address);
}