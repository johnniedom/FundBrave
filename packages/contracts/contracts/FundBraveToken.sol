// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract FundBraveToken is ERC20, Ownable, ERC20Permit {
    mapping(address => bool) public minters;

    constructor(address initialOwner) 
        ERC20("FundBrave Token", "FBT") 
        Ownable(initialOwner)
        ERC20Permit("FundBrave Token") 
    {
        _mint(initialOwner, 10_000_000 * 10**decimals());
    }

    function setMinter(address _minter, bool _active) external onlyOwner {
        minters[_minter] = _active;
    }

    function mint(address to, uint256 amount) external {
        require(minters[msg.sender], "FBT: Not authorized to mint");
        _mint(to, amount);
    }
}