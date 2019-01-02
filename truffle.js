/*
var HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonic = "orchard sting someone weapon vocal pipe ginger notice history cat bomb glad";

module.exports = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  networks: {
    ropsten: {
      provider: () =>
        new HDWalletProvider(mnemonic, "https://ropsten.infura.io/v3/f3f266164e5a45699066b781df49693c"),
        gas: 4700000,
        network_id: 3
    },
    rinkeby: {
      provider: () =>
        new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/f3f266164e5a45699066b781df49693c"),
        gas: 6700000,
        network_id: 4
    }  
  }
};
*/

 module.exports = {
   networks: {
     develop: {
       host: "127.0.0.1",
       port: 8545,
       network_id: "*" // Match any network id
     },

     test: {
       host: "127.0.0.1",
       port: 7545,
       network_id: "*" // Match any network id
     },

     mine: {
       host: "127.0.0.1",
       port: 8545,
       network_id: "*", // Match any network id
       gas: 4712382
     },
     ropsten:  {
       network_id: 3,
       host: "localhost",
       port:  8545,
       gas:   4700000
     }
   }  
 };
