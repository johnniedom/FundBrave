// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IMetaMorpho.sol";

/**
 * @title MockMetaMorpho
 * @dev Mocks an ERC4626 (MetaMorpho) vault for testing.
 * Assumes 1 share = 1 asset for simplicity.
 */
contract MockMetaMorpho {
    using SafeERC20 for IERC20;
    IERC20 public immutable asset;
    
    mapping(address => uint256) public balances;
    string public name = "Mock MetaMorpho";
    string public symbol = "mUSDT";
    uint8 public decimals = 6;

    constructor(address _asset) {
        asset = IERC20(_asset);
    }

    function asset() external view returns (address) {
        return address(asset);
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    // --- Simulates 1 share = 1 asset ---
    function previewDeposit(uint256 assets) external view returns (uint256 shares) {
        return assets;
    }

    function previewMint(uint256 shares) external view returns (uint256 assets) {
        return shares;
    }

    function previewWithdraw(uint256 assets) external view returns (uint256 shares) {
        return assets;
    }

    function previewRedeem(uint256 shares) external view returns (uint256 assets) {
        return shares;
    }
    // --- End 1:1 simulation ---

    function deposit(uint256 assets, address receiver)
        external
        returns (uint256 shares)
    {
        asset.safeTransferFrom(msg.sender, address(this), assets);
        balances[receiver] += assets; // 1:1
        return assets;
    }

    function withdraw(uint256 assets, address receiver, address owner)
        external
        returns (uint256 shares)
    {
        // In a real 4626, caller needs allowance on owner's shares
        // Here, we trust the `owner` field
        require(balances[owner] >= assets, "ERC4626: withdraw too large");
        balances[owner] -= assets;
        asset.safeTransfer(receiver, assets);
        return assets;
    }

    // Stub other functions
    function mint(uint256 shares, address receiver) external returns (uint256 assets) {
        asset.safeTransferFrom(msg.sender, address(this), shares); // 1:1
        balances[receiver] += shares;
        return shares;
    }
    
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets) {
        require(balances[owner] >= shares, "ERC4626: redeem too large");
        balances[owner] -= shares;
        asset.safeTransfer(receiver, shares); // 1:1
        return shares;
    }

    function totalAssets() external view returns (uint256) {
        return asset.balanceOf(address(this));
    }
}
