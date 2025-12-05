// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FundraiserReceiptOFT
 * @dev Cross-chain Receipt Token. Minter/Burner access controlled.
 */
contract ReceiptOFT is OFT {
    // Only the Staking Pools or Factory can mint/burn
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
        require(controllers[msg.sender], "Not authorized");
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external {
        require(controllers[msg.sender], "Not authorized");
        _burn(_from, _amount);
    }
}