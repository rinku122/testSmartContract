// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./library/TransferHelper.sol";

contract Mindpay is ERC20, ReentrancyGuard {
    struct UserDetail {
        uint128 totalInvestment; // Total native currency invested by user
        uint128 lockedInvestment; // Total native currency after 90% deduction
        uint128 totalTokens; // Total total mindpay tokens
        uint120 timeStamp; // Maintains the record for investment time
        bool isRegistered; // Record for user has registered once on platform
    }

    uint256 constant DAYS_IN_SECONDS = 120; // Total seconds in a day, assuming a day of 15 min
    address public immutable stakingContract; // Staking contract address
    address public immutable liquidityContract; // Liquidity contract address

    mapping(address => UserDetail) public users; // Gives userdetail
    mapping(address => bool) public eligibleForInvestment; // Checks eligibility of user to invest

    event Investment(
        address indexed userAddress,
        uint256 token,
        uint256 totalInvestment,
        uint256 lockedInvestment,
        uint256 time
    );

    /**
     * @notice Constructor function
     * @param _stakingContract is address of staking contract
     * @param _liquidityContract is address of liquidity contract
     * @param tokenSymbol is symbol of token
     */

    constructor(
        address payable _stakingContract,
        address _liquidityContract,
        string memory tokenSymbol
    ) ERC20("Mindpay", tokenSymbol) {
        stakingContract = _stakingContract;
        liquidityContract = _liquidityContract;
    }

    /**
     * @notice Gives the amount of mindtoken
     * @param amount Investment of user after deduction of 90 percent
     */

    function getTokenRegardingETH(uint256 amount)
        public
        pure
        returns (uint256 mindPay)
    {
        mindPay = amount * 1000;
        if (amount > 1 ether && amount < 5 ether) {
            mindPay = mindPay + ((mindPay * 10) / 100);
        } else if (amount >= 5 ether) {
            mindPay = mindPay + ((mindPay * 20) / 100);
        }
        return mindPay;
    }

    /**
     * @notice Checks weather locking period is over or not
     * @dev Also Helpfull for frontend integration as it returns mindpay tokens, locked and total investment
     */

    function isLockedTimeOver()
        public
        view
        returns (
            uint256 tokens,
            uint256 totalInvestment,
            uint256 lockedInvestment
        )
    {
        require(eligibleForInvestment[_msgSender()], "No investment found");
        require(
            block.timestamp >= users[_msgSender()].timeStamp + DAYS_IN_SECONDS,
            "Locking period not over"
        );
        return (
            users[_msgSender()].totalTokens,
            users[_msgSender()].totalInvestment,
            users[_msgSender()].lockedInvestment
        );
    }

    /**
     * @notice Function for investment
     * Maintains record for user
     */

    function invest() external payable nonReentrant {
        require(msg.value > 0, "Insufficient funds");
        require(!eligibleForInvestment[_msgSender()], "User already invetsted");
        eligibleForInvestment[_msgSender()] = true;
        uint256 _lockedAmount = (msg.value * 90) / 100;
        users[_msgSender()].lockedInvestment = uint128(_lockedAmount);
        users[_msgSender()].totalInvestment = uint128(msg.value);
        users[_msgSender()].totalTokens = uint128(
            getTokenRegardingETH(_lockedAmount)
        );
        users[_msgSender()].timeStamp = uint120(block.timestamp);
        users[_msgSender()].isRegistered = true;
        _mint(address(this), getTokenRegardingETH(_lockedAmount));
        TransferHelper.safeTransferETH(
            liquidityContract,
            (msg.value * 10) / 100
        );
        emit Investment(
            _msgSender(),
            getTokenRegardingETH(_lockedAmount),
            msg.value,
            _lockedAmount,
            block.timestamp
        );
    }

    /**
     * @notice Function for cancel investment, will transfer locked amount to user and mindpay tokens are burned
     * @dev eligibleForInvestment is set to true which will allow user to invest again
     * @dev all parameters are reinitialized  so that user can start the cycle again
     * @dev isRegistered parameters is not reinitialized, as it records that user has invested once
     */

    function cancelInvestment() external payable nonReentrant {
        (uint256 token, , uint256 lockedInvestment) = isLockedTimeOver();
        eligibleForInvestment[_msgSender()] = false;
        users[_msgSender()].lockedInvestment = 0;
        users[_msgSender()].totalInvestment = 0;
        users[_msgSender()].totalTokens = 0;
        users[_msgSender()].timeStamp = 0;
        TransferHelper.safeTransferETH(_msgSender(), lockedInvestment);
        _burn(address(this), token);
    }

    /**
     * @notice Function for staking investment, which transfer tokens to staking  and locked amount to liquidity contract
     * @dev eligibleForInvestment is set to true which will allow user to invest again
     * @dev all parameters are reinitialized  so that user can start the cycle again
     * @dev isRegistered parameters is not reinitialized, as it records that user has invested once
     */

    function stakeInvestment() external payable nonReentrant {
        (uint256 token, , uint256 lockedInvestment) = isLockedTimeOver();
        eligibleForInvestment[_msgSender()] = false;
        users[_msgSender()].lockedInvestment = 0;
        users[_msgSender()].totalInvestment = 0;
        users[_msgSender()].totalTokens = 0;
        users[_msgSender()].timeStamp = 0;
        TransferHelper.safeTransferETH(liquidityContract, lockedInvestment);
        _transfer(address(this), stakingContract, token);
    }
}
