pragma solidity ^0.4.23;

interface TeamPerfitForwarderInterface {
    function deposit() external payable returns(bool);
    function status() external view returns(address, address);
}
