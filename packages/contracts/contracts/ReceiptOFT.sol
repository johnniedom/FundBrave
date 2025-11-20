// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FundraiserReceiptOFT
 * @dev A cross-chain "Receipt Token" for stakers.
 * When you stake USDC, you get this OFT as proof.
 * You can bridge this receipt back to your home chain!
 */
contract ReceiptOFT is OFT {
    mapping(address => bool) public controllers;

    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) Ownable(_delegate) {}

    function setController(address _controller, bool _enabled) external onlyOwner {
        controllers[_controller] = _enabled;
    }

    function mint(address _to, uint256 _amount) external {
        require(controllers[msg.sender], "Not authorized to mint");
        _mint(_to, _amount);
    }
}