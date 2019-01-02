var playBook = artifacts.require("PlayerBook");
var reserveBag = artifacts.require("ReserveBag");
var BigNumber = require('bignumber.js')

contract('ReserveBag', function(accounts) {
    it("register name test", function() {
        console.log("begin to register name test");

        var account0 = accounts[0];
        var account1 = accounts[1];

        var playBookInstance;
        var reserveBagInstance;

        var balance1 = new BigNumber(0)
        var balance2 = new BigNumber(0)
        var myGasPrice = new BigNumber(22000000000)

        var registerNameFee = new BigNumber(10).pow(16)

        console.log("account0: ", account0)

        return playBook.deployed({from: account0}).then(function(instance) {
            playBookInstance = instance;
            console.log("playBookInstance address: ", playBookInstance.address)
            return reserveBag.deployed(0, playBookInstance.address, {from: account0});
        }).then(function(instance) {
            reserveBagInstance = instance;
            console.log("reserveBagInstance address: ", reserveBagInstance.address)
            return reserveBagInstance.getActivated()
        // }).then(function() {
        //     console.log("begin add game")
        //     return playBookInstance.addGame(reserveBagInstance.address, "fomogame")
        // }).then(function(txReceipt) {
        //     console.log("txReceipt.receipt.status: ", txReceipt.receipt.status)
        //     assert.equal(txReceipt.receipt.status, '0x1', "addGame fail!");
        //     console.log("addGame ok.");
        }).then(function(activated) {
            if(!activated) {
                console.log("begin activate")
                return reserveBagInstance.activate({from: account0})
            }
        }).then(function(txReceipt) {
            if(txReceipt != null) {
                assert.equal(txReceipt.receipt.status, '0x1', "activate fail!");
                console.log("activate ok.");
            }

            return web3.eth.getBalance(account1)
        }).then(function(balance) {
            balance1 = new BigNumber(balance)
            console.log("account0 balance before: ", balance);

            return reserveBagInstance.getCurrentRoundInfo.call();
        }).then(function(info) {
            console.log("getCurrentRoundInfo info: ", info)

            return reserveBagInstance.registerName("wwyx", true, {from: account1, value: registerNameFee.toString(), gasPrice: myGasPrice.toString()})
        }).then(function(txReceipt) {
            assert.equal(txReceipt.receipt.status, '0x1', "registerName fail!");

            gasUsed = txReceipt.receipt.gasUsed
            console.log("registerName successfully. gasUsed: ", gasUsed);

            return web3.eth.getBalance(account1)
        }).then(function(balance) {
            balance2 = new BigNumber(balance)
            console.log("account0 balance after: ", balance.toString());

            var gasFee = new BigNumber(gasUsed).times(myGasPrice)

            var balance3 = new BigNumber(balance2).plus(gasFee).plus(registerNameFee)

            if(!balance1.isEqualTo(balance3)) {
                assert(false, "balance incorrect! " + balance1.toString() + balance3.toString())
            }

            return reserveBagInstance.getPlayerInfoByAddress(account1)
        }).then(function(info) {
            console.log("getPlayerInfoByAddress info: ", info)
        });
    });
});