pragma solidity ^0.4.23;

contract DRSEvents {
    // fired whenever a player registers a name
    event onNewName
    (
        uint256 indexed playerID,
        address indexed playerAddress,
        bytes32 indexed playerName,
        bool isNewPlayer,
        // uint256 affiliateID,
        // address affiliateAddress,
        // bytes32 affiliateName,
        uint256 amountPaid,
        uint256 timeStamp
    );

    // fired at end of buy or reload
    event onEndTx
    (
        uint256 compressedData,
        uint256 compressedIDs,

        bytes32 playerName,
        address playerAddress,
        uint256 ethIn,
        uint256 keyIndex,

        address winnerAddr,
        bytes32 winnerName,
        uint256 amountWon,

        uint256 newPot,
        uint256 genAmount,
        uint256 potAmount,

        address genAddr,
        uint256 genKeyPrice
    );

    // fired whenever theres a withdraw
    event onWithdraw
    (
        uint256 indexed playerID,
        address playerAddress,
        bytes32 playerName,
        uint256 ethOut,
        uint256 timeStamp
    );

    // fired whenever a withdraw forces end round to be ran
    event onWithdrawAndDistribute
    (
        address playerAddress,
        bytes32 playerName,
        uint256 ethOut,
        uint256 compressedData,

        uint256 compressedIDs,

        address winnerAddr,
        bytes32 winnerName,
        uint256 amountWon,

        uint256 newPot,
        uint256 genAmount
    );

    // fired whenever a player tries a buy after round timer
    // hit zero, and causes end round to be ran.
    event onBuyAndDistribute
    (
        address playerAddress,
        bytes32 playerName,
        uint256 ethIn,
        uint256 compressedData,

        uint256 compressedIDs,

        address winnerAddr,
        bytes32 winnerName,
        uint256 amountWon,

        uint256 newPot,
        uint256 genAmount
    );

    // fired whenever a player tries a reload after round timer
    // hit zero, and causes end round to be ran.
    event onReLoadAndDistribute
    (
        address playerAddress,
        bytes32 playerName,
        uint256 compressedData,

        uint256 compressedIDs,

        address winnerAddr,
        bytes32 winnerName,
        uint256 amountWon,

        uint256 newPot,
        uint256 genAmount
    );

    event onBuyKeyFailure
    (
        uint256 roundID,
        uint256 indexed playerID,
        address playerAddress,
        uint256 amount,
        uint256 keyIndex,
        uint256 timeStamp
    );
    event onAffiliatePayout
    (
        uint256 indexed affiliateID,
        address affiliateAddress,
        bytes32 affiliateName,
        uint256 indexed buyerID,
        uint256 amount,
        uint256 timeStamp
    );
}