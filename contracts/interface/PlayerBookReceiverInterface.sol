pragma solidity ^0.4.23;

interface PlayerBookReceiverInterface {
    function receivePlayerInfo(uint256 _pID, address _addr, bytes32 _name) external;
    function receivePlayerNameList(uint256 _pID, bytes32 _name) external;
}
