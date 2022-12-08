// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./library/TransferHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Staking is Ownable, ReentrancyGuard {
    function removeFunds(address _mindpay) public onlyOwner nonReentrant {
        uint256 totalmindpay = IERC20(_mindpay).balanceOf(address(this));
        TransferHelper.safeTransfer(_mindpay, owner(), totalmindpay);
    }
}
