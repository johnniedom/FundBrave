// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Fundraiser
 * @dev This is the individual "piggy bank" contract for each campaign.
 * It holds the state, the internal logic,
 * and the final USDT funds.
 * It can ONLY be credited with donations by the `FundraiserFactory`.
 */
contract Fundraiser is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct Donation {
        uint256 value;
        uint256 date;
        address token;
        string sourceChain;
    }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 date;
        uint256 upvotes;
        uint256 downvotes;
        uint256 requiredVotes;
        bool executed;
        bool exists;
    }

    struct MediaArchive {
        uint256 id;
        string title;
        string description;
        string url;
        string verificationType;
        uint256 date;
        bool verified;
    }

    struct AllDonation {
        address donor;
        uint256 value;
        uint256 date;
        address token;
        string sourceChain;
    }

    mapping(address => Donation[]) private _donations;
    mapping(uint256 => AllDonation[]) private _allDonations;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => MediaArchive) public mediaArchives;
    mapping(address => bool) public _donors;
    mapping(address => mapping(uint256 => bool)) public hasVoted;
    mapping(address => uint256) public donorVotingPower;

    address public immutable USDT;
    address public immutable factoryAddress;

    // --- Events ---
    event DonationCredited(
        address indexed donor,
        uint256 amount,
        string sourceChain
    );
    event ProposalCreated(uint256 id, string title, uint256 requiredVotes);
    event Voted(uint256 id, address indexed voter, bool upvote);
    event ProposalExecuted(uint256 id);
    event MediaArchiveCreated(uint256 id, string title, string url, bool verified);
    event Withdraw(uint256 amount, address token);

    // --- State Variables ---
    uint256 public id;
    string public name;
    string[] public images;
    string[] public categories;
    string public description;
    string public region;
    address payable public beneficiary;
    uint256 public totalDonations;
    uint256 public totalDonationsCount;
    uint256 public proposalCount;
    uint256 public mediaArchiveCount;
    uint256 public donationsCount;
    uint256 public goal;
    uint256 public deadline;

    // --- Constructor ---
    constructor(
        uint256 _id,
        string memory _name,
        string[] memory _images,
        string[] memory _categories,
        string memory _description,
        string memory _region,
        address payable _beneficiary,
        address _custodian,
        uint256 _goal,
        uint256 _deadline,
        address _usdt,
        address _platformFeeRecipient,
        address _factoryAddress
    ) Ownable(_custodian) {
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_goal > 0, "Goal must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_usdt != address(0), "Invalid USDT address");
        require(_factoryAddress != address(0), "Invalid factory address");

        id = _id;
        name = _name;
        images = _images;
        categories = _categories;
        description = _description;
        region = _region;
        beneficiary = _beneficiary;
        goal = _goal;
        deadline = _deadline;
        USDT = _usdt;
        platformFeeRecipient = _platformFeeRecipient;
        factoryAddress = _factoryAddress;
    }

    // --- Modifiers ---

    modifier onlyFactory() {
        require(
            msg.sender == factoryAddress,
            "Fundraiser: Caller is not the factory"
        );
        _;
    }

    modifier onlyDonor() {
        require(_donors[msg.sender], "Only donors can perform this action");
        _;
    }

    modifier beforeDeadline() {
        require(block.timestamp < deadline, "Fundraiser has ended");
        _;
    }

    // --- Core Donation Function ---

    /**
     * @dev Credits a donation that was processed by the factory.
     * This is the final step for all donations (native, ERC20, cross-chain).
     * The `usdtAmount` is the final amount *after* any swaps.
     */
    function creditDonation(
        address donor,
        uint256 usdtAmount,
        string calldata sourceChain
    ) external nonReentrant whenNotPaused onlyFactory {
        _recordDonation(donor, usdtAmount, USDT, sourceChain);
        emit DonationCredited(donor, usdtAmount, sourceChain);
    }

    /**
     * @dev Internal function to record a donation after it's been processed.
     */
    function _recordDonation(
        address donor,
        uint256 value,
        address token,
        string memory sourceChain
    ) private {
        Donation memory donation = Donation({
            value: value,
            date: block.timestamp,
            token: token,
            sourceChain: sourceChain
        });

        AllDonation memory allDonation = AllDonation({
            donor: donor,
            value: value,
            date: block.timestamp,
            token: token,
            sourceChain: sourceChain
        });

        _donations[donor].push(donation);
        _allDonations[id].push(allDonation);
        totalDonations += value;
        donationsCount++;
        totalDonationsCount++;

        if (!_donors[donor]) {
            _donors[donor] = true;
        }

        // Voting power is based on donation amount
        donorVotingPower[donor] += value;
    }

    // ===== PROPOSAL FUNCTIONS =====

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _requiredVotes
    ) external onlyOwner {
        proposalCount++;

        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: _title,
            description: _description,
            date: block.timestamp,
            upvotes: 0,
            downvotes: 0,
            requiredVotes: _requiredVotes,
            executed: false,
            exists: true
        });

        emit ProposalCreated(proposalCount, _title, _requiredVotes);
    }

    function vote(uint256 _id, bool _upvote) external onlyDonor {
        Proposal storage proposal = proposals[_id];
        require(proposal.exists, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!hasVoted[msg.sender][_id], "Already voted");

        uint256 votingPower = donorVotingPower[msg.sender];

        if (_upvote) {
            proposal.upvotes += votingPower;
        } else {
            proposal.downvotes += votingPower;
        }

        hasVoted[msg.sender][_id] = true;
        emit Voted(_id, msg.sender, _upvote);
    }

    function executeProposal(uint256 _id) external onlyOwner {
        Proposal storage proposal = proposals[_id];
        require(proposal.exists, "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        require(proposal.upvotes >= proposal.requiredVotes, "Not enough votes");

        proposal.executed = true;
        emit ProposalExecuted(_id);
    }

    function getProposals() external view returns (Proposal[] memory) {
        Proposal[] memory allProposals = new Proposal[](proposalCount);
        for (uint256 i = 1; i <= proposalCount; i++) {
            allProposals[i - 1] = proposals[i];
        }
        return allProposals;
    }

    // ===== MEDIA ARCHIVE FUNCTIONS =====

    function createMediaArchive(
        string memory _title,
        string memory _description,
        string memory _url,
        string memory _verificationType,
        bool _verified
    ) external onlyOwner {
        mediaArchiveCount++;

        mediaArchives[mediaArchiveCount] = MediaArchive({
            id: mediaArchiveCount,
            title: _title,
            description: _description,
            url: _url,
            verificationType: _verificationType,
            date: block.timestamp,
            verified: _verified
        });

        emit MediaArchiveCreated(mediaArchiveCount, _title, _url, _verified);
    }

    function getMediaArchive() external view returns (MediaArchive[] memory) {
        MediaArchive[] memory allMediaArchives = new MediaArchive[](
            mediaArchiveCount
        );
        for (uint256 i = 1; i <= mediaArchiveCount; i++) {
            allMediaArchives[i - 1] = mediaArchives[i];
        }
        return allMediaArchives;
    }

    // ===== QUERY FUNCTIONS =====

    function myDonationsCount() external view returns (uint256) {
        return _donations[msg.sender].length;
    }

    function allDonationsCount() external view returns (uint256) {
        return _allDonations[id].length;
    }

    function myDonations()
        external
        view
        returns (
            uint256[] memory values,
            uint256[] memory dates,
            address[] memory tokens,
            string[] memory sourceChains
        )
    {
        uint256 count = _donations[msg.sender].length;
        values = new uint256[](count);
        dates = new uint256[](count);
        tokens = new address[](count);
        sourceChains = new string[](count);

        for (uint256 i = 0; i < count; i++) {
            Donation storage donation = _donations[msg.sender][i];
            values[i] = donation.value;
            dates[i] = donation.date;
            tokens[i] = donation.token;
            sourceChains[i] = donation.sourceChain;
        }

        return (values, dates, tokens, sourceChains);
    }

    function allDonations()
        external
        view
        returns (
            address[] memory donors,
            uint256[] memory values,
            uint256[] memory dates,
            address[] memory tokens
        )
    {
        uint256 count = _allDonations[id].length;
        donors = new address[](count);
        values = new uint256[](count);
        dates = new uint256[](count);
        tokens = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            AllDonation storage donation = _allDonations[id][i];
            donors[i] = donation.donor;
            values[i] = donation.value;
            dates[i] = donation.date;
            tokens[i] = donation.token;
        }

        return (donors, values, dates, tokens);
    }

    function getImageUrls() external view returns (string[] memory) {
        return images;
    }

    function getCategories() external view returns (string[] memory) {
        return categories;
    }

    function getFundraiserStats()
        external
        view
        returns (
            uint256 _totalDonations,
            uint256 _totalDonationsCount,
            uint256 _goal,
            uint256 _deadline,
            bool _isActive
        )
    {
        return (
            totalDonations,
            totalDonationsCount,
            goal,
            deadline,
            block.timestamp < deadline
        );
    }

    // ===== ADMIN FUNCTIONS =====

    function setBeneficiary(address payable _beneficiary) external onlyOwner {
        require(_beneficiary != address(0), "Invalid address");
        beneficiary = _beneficiary;
    }

    function extendDeadline(uint256 newDeadline) external onlyOwner {
        require(newDeadline > deadline, "New deadline must be later");
        deadline = newDeadline;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraws all *donated* funds (USDT) to the beneficiary.
     * This function respects the staked amount, leaving it untouched.
     */
    function withdrawUSDT() external onlyOwner nonReentrant {
        uint256 balance = IERC20(USDT).balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");

        IERC20(USDT).safeTransfer(beneficiary, balance);
        emit Withdraw(balance, USDT);
    }

    /**
     * @dev Returns the version of the contract
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}