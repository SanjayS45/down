// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Down
/// @notice One group lock. Friends chip in a fixed amount. If the group
///         fills, the booker takes the pot. If the deadline hits first,
///         anyone can refund everyone.
contract Down {
    address public immutable booker;
    uint256 public immutable amountPerSeat;
    uint32 public immutable seatsRequired;
    uint40 public immutable deadline;
    string public title;

    uint32 public seatsFilled;
    bool public closed;
    mapping(address => bool) public inPool;
    address[] public participants;

    error EmptyTitle();
    error TitleTooLong();
    error BadAmount();
    error BadSeats();
    error DeadlineInPast();
    error Closed();
    error AlreadyIn();
    error WrongAmount();
    error Full();
    error Late();
    error NotBooker();
    error NotFull();
    error StillOpen();
    error NotIn();
    error Locked();
    error TransferFailed();

    event ChippedIn(address indexed person);
    event Left(address indexed person);
    event Withdrawn(address indexed booker, uint256 amount);
    event Refunded();

    constructor(
        string memory title_,
        uint256 amountPerSeat_,
        uint32 seatsRequired_,
        uint40 deadline_
    ) {
        uint256 titleLen = bytes(title_).length;
        if (titleLen == 0) revert EmptyTitle();
        if (titleLen > 80) revert TitleTooLong();
        if (amountPerSeat_ == 0) revert BadAmount();
        if (seatsRequired_ < 2 || seatsRequired_ > 30) revert BadSeats();
        if (deadline_ <= block.timestamp) revert DeadlineInPast();

        booker = msg.sender;
        title = title_;
        amountPerSeat = amountPerSeat_;
        seatsRequired = seatsRequired_;
        deadline = deadline_;
    }

    function chipIn() external payable {
        if (closed) revert Closed();
        if (block.timestamp >= deadline) revert Late();
        if (inPool[msg.sender]) revert AlreadyIn();
        if (msg.value != amountPerSeat) revert WrongAmount();
        if (seatsFilled >= seatsRequired) revert Full();

        inPool[msg.sender] = true;
        seatsFilled += 1;
        participants.push(msg.sender);
        emit ChippedIn(msg.sender);
    }

    function dropOut() external {
        if (closed) revert Closed();
        if (seatsFilled >= seatsRequired) revert Locked();
        if (!inPool[msg.sender]) revert NotIn();

        inPool[msg.sender] = false;
        seatsFilled -= 1;
        emit Left(msg.sender);

        (bool ok, ) = msg.sender.call{value: amountPerSeat}("");
        if (!ok) revert TransferFailed();
    }

    function withdraw() external {
        if (msg.sender != booker) revert NotBooker();
        if (closed) revert Closed();
        if (seatsFilled < seatsRequired) revert NotFull();

        closed = true;
        uint256 amount = address(this).balance;
        emit Withdrawn(booker, amount);

        (bool ok, ) = booker.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function refundAll() external {
        if (closed) revert Closed();
        if (block.timestamp < deadline) revert StillOpen();
        if (seatsFilled >= seatsRequired) revert Full();

        closed = true;
        emit Refunded();
        uint256 n = participants.length;
        uint256 share = amountPerSeat;
        for (uint256 i = 0; i < n; i++) {
            address person = participants[i];
            if (!inPool[person]) continue;
            inPool[person] = false;
            (bool ok, ) = person.call{value: share}("");
            if (!ok) revert TransferFailed();
        }
    }

    function getState()
        external
        view
        returns (
            address booker_,
            string memory title_,
            uint256 amountPerSeat_,
            uint32 seatsRequired_,
            uint32 seatsFilled_,
            uint40 deadline_,
            bool closed_,
            address[] memory people_
        )
    {
        address[] memory people = new address[](seatsFilled);
        uint256 n = participants.length;
        uint256 j = 0;
        for (uint256 i = 0; i < n; i++) {
            address person = participants[i];
            if (inPool[person]) {
                people[j] = person;
                j += 1;
            }
        }

        return (
            booker,
            title,
            amountPerSeat,
            seatsRequired,
            seatsFilled,
            deadline,
            closed,
            people
        );
    }
}
