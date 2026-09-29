// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Down} from "../src/Down.sol";

contract DownTest is Test {
    Down internal down;
    address internal booker = address(0xA11CE);
    address internal a = address(0xB0B);
    address internal b = address(0xCAFE);
    address internal c = address(0xF00D);

    uint256 internal constant SHARE = 0.01 ether;
    uint40 internal deadline;

    function setUp() public {
        deadline = uint40(block.timestamp + 7 days);
        vm.deal(booker, 1 ether);
        vm.deal(a, 1 ether);
        vm.deal(b, 1 ether);
        vm.deal(c, 1 ether);
        vm.prank(booker);
        down = new Down("Airbnb", SHARE, 3, deadline);
    }

    function test_chipInAndWithdraw() public {
        vm.prank(a);
        down.chipIn{value: SHARE}();
        vm.prank(b);
        down.chipIn{value: SHARE}();
        vm.prank(c);
        down.chipIn{value: SHARE}();

        uint256 before = booker.balance;
        vm.prank(booker);
        down.withdraw();
        assertEq(booker.balance, before + 3 * SHARE);
        assertTrue(down.closed());
    }

    function test_leaveBeforeFull() public {
        vm.prank(a);
        down.chipIn{value: SHARE}();
        uint256 before = a.balance;
        vm.prank(a);
        down.dropOut();
        assertEq(a.balance, before + SHARE);
        assertEq(down.seatsFilled(), 0);

        (, , , , uint32 filled, , , address[] memory people) = down.getState();
        assertEq(filled, 0);
        assertEq(people.length, 0);
    }

    function test_cannotLeaveOnceFull() public {
        vm.prank(a);
        down.chipIn{value: SHARE}();
        vm.prank(b);
        down.chipIn{value: SHARE}();
        vm.prank(c);
        down.chipIn{value: SHARE}();

        vm.prank(a);
        vm.expectRevert(Down.Locked.selector);
        down.dropOut();
    }

    function test_refundAllAfterDeadline() public {
        vm.prank(a);
        down.chipIn{value: SHARE}();
        vm.prank(b);
        down.chipIn{value: SHARE}();

        vm.warp(uint256(deadline) + 1);
        uint256 aBefore = a.balance;
        uint256 bBefore = b.balance;
        down.refundAll();
        assertEq(a.balance, aBefore + SHARE);
        assertEq(b.balance, bBefore + SHARE);
        assertTrue(down.closed());
    }

    function test_refundAllBeforeDeadlineReverts() public {
        vm.prank(a);
        down.chipIn{value: SHARE}();
        vm.expectRevert(Down.StillOpen.selector);
        down.refundAll();
    }

    function test_wrongAmountReverts() public {
        vm.prank(a);
        vm.expectRevert(Down.WrongAmount.selector);
        down.chipIn{value: SHARE + 1}();
    }

    function test_nonBookerCannotWithdraw() public {
        vm.prank(a);
        down.chipIn{value: SHARE}();
        vm.prank(b);
        down.chipIn{value: SHARE}();
        vm.prank(c);
        down.chipIn{value: SHARE}();

        vm.prank(a);
        vm.expectRevert(Down.NotBooker.selector);
        down.withdraw();
    }

    function test_cannotChipInTwice() public {
        vm.prank(a);
        down.chipIn{value: SHARE}();
        vm.prank(a);
        vm.expectRevert(Down.AlreadyIn.selector);
        down.chipIn{value: SHARE}();
    }

    function test_getState() public {
        vm.prank(a);
        down.chipIn{value: SHARE}();
        (
            address booker_,
            string memory title_,
            uint256 amount_,
            uint32 seatsRequired_,
            uint32 seatsFilled_,
            uint40 deadline_,
            bool closed_,
            address[] memory people
        ) = down.getState();

        assertEq(booker_, booker);
        assertEq(title_, "Airbnb");
        assertEq(amount_, SHARE);
        assertEq(seatsRequired_, 3);
        assertEq(seatsFilled_, 1);
        assertEq(deadline_, deadline);
        assertFalse(closed_);
        assertEq(people.length, 1);
        assertEq(people[0], a);
    }
}
