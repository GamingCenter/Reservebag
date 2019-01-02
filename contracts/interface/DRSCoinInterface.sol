pragma solidity ^0.4.23;

interface DRSCoinInterface {
    function mint(address _to, uint256 _amount) external;
    function profitEth() external payable;
}