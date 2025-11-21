// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MessagingFee, Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";

interface ILayerZeroReceiver {
    function lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external payable;
}

/**
 * @title MockLZEndpoint
 * @dev Simulates LayerZero V2 Endpoint for local testing.
 */
contract MockLZEndpoint {
    uint32 public eid;
    address public delegate;

    event PacketSent(bytes payload);

    constructor(uint32 _eid) {
        eid = _eid;
    }

    // --- Required by OApp Constructor ---
    function setDelegate(address _delegate) external {
        delegate = _delegate;
    }

    // Simulate the quote function
    function quote(
        address /*_sender*/,
        uint32 /*_dstEid*/,
        bytes calldata /*_message*/,
        bytes calldata /*_options*/,
        bool /*_payInLzToken*/
    ) external pure returns (MessagingFee memory fee) {
        return MessagingFee(0, 0);
    }

    // Simulate sending a message
    function send(
        address /*_sender*/,
        uint32 /*_dstEid*/,
        bytes calldata _message,
        bytes calldata /*_options*/,
        address /*_refundAddress*/,
        address /*_zroPaymentAddress*/,
        bytes calldata /*_adapterParams*/
    ) external payable returns (MessagingFee memory fee) {
        emit PacketSent(_message);
        return MessagingFee(0, 0);
    }

    // Helper to mock receiving a message on the destination OApp
    function mockReceive(
        address _oapp, 
        uint32 _srcEid, 
        bytes32 _guid, 
        bytes calldata _message
    ) external payable {
        // Construct the Origin struct expected by V2
        Origin memory origin = Origin(_srcEid, bytes32(uint256(uint160(msg.sender))), 1);
        
        ILayerZeroReceiver(_oapp).lzReceive{value: msg.value}(
            origin,
            _guid,
            _message,
            address(0),
            ""  
        );
    }
}