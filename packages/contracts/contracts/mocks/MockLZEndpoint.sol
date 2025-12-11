// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockLZEndpoint
 * @notice Mock LayerZero endpoint for testing
 */
contract MockLZEndpoint {
    bool public acceptMessage;

    function setAcceptMessage(bool _accept) external {
        acceptMessage = _accept;
    }

    function send(
        uint16,
        bytes calldata,
        bytes calldata,
        address payable,
        address,
        bytes calldata
    ) external payable {
        require(acceptMessage, "Message not accepted");
    }

    function deliverMessage(
        address target,
        uint32 srcEid,
        bytes calldata payload
    ) external {
        // Simulate LayerZero delivery by calling _lzReceive
        (bool success, ) = target.call(
            abi.encodeWithSignature(
                "_lzReceive((uint32,bytes32,uint64),bytes32,bytes,address,bytes)",
                Origin(srcEid, bytes32(0), 0),
                bytes32(0),
                payload,
                address(0),
                ""
            )
        );
        require(success, "Delivery failed");
    }

    struct Origin {
        uint32 srcEid;
        bytes32 sender;
        uint64 nonce;
    }
}
