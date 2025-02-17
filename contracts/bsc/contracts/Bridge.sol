// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Bridge is Ownable {
    event Locked(address indexed sender, uint256 amount, string targetChainAddress);
    event Released(address indexed receiver, uint256 amount);

    IERC20 public token;

    constructor(address tokenAddress, address initialOwner) Ownable(initialOwner) {
        token = IERC20(tokenAddress);
    }

    function lockTokens(uint256 amount, string memory targetChainAddress) external {
        require(amount > 0, "Amount must be greater than zero");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        emit Locked(msg.sender, amount, targetChainAddress);
    }

    function releaseTokens(address receiver, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        require(token.balanceOf(address(this)) >= amount, "Insufficient balance");

        token.transfer(receiver, amount);
        emit Released(receiver, amount);
    }
}
