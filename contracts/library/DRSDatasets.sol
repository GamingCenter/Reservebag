pragma solidity ^0.4.23;

// structs ==============================================================================
library DRSDatasets {
  //compressedData key
  // [24-14][13-3][2][1][0]
  // 0 - new player (bool)
  // 1 - joined round (bool)
  // 2 - new leader (bool)
  // 3-13 - round end time
  // 14 - 24 timestamp
  
  //compressedIDs key
  // [77-52][51-26][25-0]
  // 0-25 - pID
  // 26-51 - winPID
  // 52-77 - rID
  struct EventReturns {
    uint256 compressedData;
    uint256 compressedIDs;
    
    address winnerAddr; // winner address
    bytes32 winnerName; // winner name
    uint256 amountWon; // amount won
    
    uint256 newPot; // amount in new pot
    uint256 genAmount; // amount distributed to gen
    uint256 potAmount; // amount added to pot
    
    address genAddr;
    uint256 genKeyPrice;
  }
  
  function setNewPlayerFlag(EventReturns _event) internal pure returns(EventReturns) {
    _event.compressedData = _event.compressedData + 1;
    return _event;
  }
  
  function setJoinedRoundFlag(EventReturns _event) internal pure returns(EventReturns) {
    _event.compressedData = _event.compressedData + 10;
    return _event;
  }
  
  function setNewLeaderFlag(EventReturns _event) internal pure returns(EventReturns) {
    _event.compressedData = _event.compressedData + 100;
    return _event;
  }
  
  function setRoundEndTime(EventReturns _event, uint256 roundEndTime) internal pure returns(EventReturns) {
    _event.compressedData = _event.compressedData + roundEndTime * (10**3);
    return _event;
  }
  
  function setTimestamp(EventReturns _event, uint256 timestamp) internal pure returns(EventReturns) {
    _event.compressedData = _event.compressedData + timestamp * (10**14);
    return _event;
  }
  
  function setPID(EventReturns _event, uint256 _pID) internal pure returns(EventReturns) {
    _event.compressedIDs = _event.compressedIDs + _pID;
    return _event;
  }
  
  function setWinPID(EventReturns _event, uint256 _winPID) internal pure returns(EventReturns) {
    _event.compressedIDs = _event.compressedIDs + (_winPID * (10**26));
    return _event;
  }
  
  function setRID(EventReturns _event, uint256 _rID) internal pure returns(EventReturns) {
    _event.compressedIDs = _event.compressedIDs + (_rID * (10**52));
    return _event;
  }
  
  function setWinner(EventReturns _event, address _winnerAddr, bytes32 _winnerName, uint256 _amountWon)
  internal pure returns(EventReturns) {
    _event.winnerAddr = _winnerAddr;
    _event.winnerName = _winnerName;
    _event.amountWon = _amountWon;
    return _event;
  }
  
  function setGenInfo(EventReturns _event, address _genAddr, uint256 _genKeyPrice)
  internal pure returns(EventReturns) {
    _event.genAddr = _genAddr;
    _event.genKeyPrice = _genKeyPrice;
  }
  
  function setNewPot(EventReturns _event, uint256 _newPot) internal pure returns(EventReturns) {
    _event.newPot = _newPot;
    return _event;
  }
  
  function setGenAmount(EventReturns _event, uint256 _genAmount) internal pure returns(EventReturns) {
    _event.genAmount = _genAmount;
    return _event;
  }
  
  function setPotAmount(EventReturns _event, uint256 _potAmount) internal pure returns(EventReturns) {
    _event.potAmount = _potAmount;
    return _event;
  }
  
  struct Player {
    address addr; // player address
    bytes32 name; // player name
    uint256 win; // winnings vault
    uint256 gen; // general vault
    uint256 aff; // affiliate vault
    uint256 lrnd; // last round played
    uint256 laff; // last affiliate id used
  }
  
  struct PlayerRound {
    uint256 eth; // eth player has added to round (used for eth limiter)
    uint256 keys; // keys
  }
  
  struct Round {
    uint256 plyr; // pID of player in lead
    
    uint256 end; // time ends/ended
    bool ended; // has round end function been ran
    uint256 strt; // time round started
    uint256 keys; // keys
    uint256 eth; // total eth in
    uint256 pot; // eth to pot (during round) / final amount paid to winner (after round ends)
  }
  
  struct BuyInfo {
    address addr; // player address
    bytes32 name; // player name
    uint256 pid; // player id
    uint256 keyPrice;
    uint256 keyIndex;
  }
}
