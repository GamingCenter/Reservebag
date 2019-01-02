var playBook = artifacts.require("PlayerBook");
var reserveBag = artifacts.require("ReserveBag");
var drsCoin = artifacts.require("DRSCoin")
var teamPerfitForwarder = artifacts.require("TeamPerfitForwarder")
var BigNumber = require('bignumber.js')

contract('ReserveBag', function(accounts) {
    var keyPrices = new Array(40)
    var price = new BigNumber(10).pow(18)

    for(var i = 0; i < 40; i++)
    {
        keyPrices[i] = price
        price = new BigNumber(price.times(1008).div(1000).toFixed(0, BigNumber.ROUND_FLOOR))
    }

    var balance1 = new BigNumber(10)
    var balance2 = new BigNumber(10)
    var perfit = new BigNumber(10)
    var gasUsed = new BigNumber(10)
    var myGasPrice = new BigNumber(22000000000)

    it("withdraw team perfit test", function() {
        console.log("begin to withdraw team perfit test");

        var account0 = accounts[0];
        var playBookInstance;
        var reserveBagInstance;

        console.log("account0: ", account0)

        return playBook.deployed({from: account0}).then(function(instance) {
            playBookInstance = instance;
            console.log("playBookInstance address: ", playBookInstance.address)
            return reserveBag.deployed(teamPerfitForwarder.address, playBookInstance.address, drsCoin.address, {from: account0});
        }).then(function(instance) {
            reserveBagInstance = instance;
            console.log("reserveBagInstance address: ", reserveBagInstance.address)

            return reserveBagInstance.setTeamPerfitAddress(0, {from: account0})
        }).then(function(txReceipt) {
            assert.equal(txReceipt.receipt.status, '0x1', "setTeamPerfitAddress to 0 fail!");
            console.log("setTeamPerfitAddress to 0 successfully.");

            return reserveBagInstance.teamPerfit.call()
        }).then(function(res) {
            console.log("reserveBagInstance teamPerfit: ", res)

            return reserveBagInstance.getActivated()
        }).then(async function(activated) {
            if(!activated) {
                console.log("begin activate")
                let txReceipt = await reserveBagInstance.activate({from: account0})
                assert.equal(txReceipt.receipt.status, '0x1', "activate fail!");
                console.log("activate ok.");
            }

            return reserveBagInstance.registerName("aaabc", true, {from: account0, value: Math.pow(10, 16)})
        }).then(function(txReceipt) {
            assert.equal(txReceipt.receipt.status, '0x1', "registerName fail!");
            console.log("registerName successfully.");

            return reserveBagInstance.getCurrentRoundInfo.call()
        }).then(function(info) {
            console.log("info1: ", info)

            var keyPrice = info[4].toNumber()

            return reserveBagInstance.buyKey({from: account0, value: keyPrice})
        }).then(function(txReceipt) {
            assert.equal(txReceipt.receipt.status, '0x1', "buyKey fail!")
            console.log("buyKey successfully.")

            return web3.eth.getBalance(account0)
        }).then(function(balance) {
            balance1 = new BigNumber(balance)
            console.log("balance1: ", balance1.toString());

            return reserveBagInstance.getTeamPerfitAmuont.call()
        }).then(function(teamPerfitAmuont) {
            perfit = new BigNumber(teamPerfitAmuont)
            console.log("teamPerfitAmuont: ", perfit.toString());

            return reserveBagInstance.withdrawTeamPerfit({from: account0, gasPrice: myGasPrice.toString()})
        }).then(function(txReceipt) {
            assert.equal(txReceipt.receipt.status, '0x1', "withdrawTeamPerfit fail!")

            gasUsed = new BigNumber(txReceipt.receipt.gasUsed)
            console.log("withdrawTeamPerfit successfully. gasUsed: ", gasUsed.toString())

            return web3.eth.getBalance(account0)
        }).then(function(balance) {
            balance2 = new BigNumber(balance)
            var gasFee = gasUsed.times(myGasPrice)

            console.log("balance2: ", balance2.toString());
            console.log("gasFee: ", gasFee.toString());

            console.log("balance1 + teamPerfit = ", balance1.plus(perfit).toString())
            console.log("account2 + gasFee = ", balance2.plus(gasFee).toString())

            if(!balance1.plus(perfit).isEqualTo(balance2.plus(gasFee))) {
                assert(false, "balance incorrect! " + balance1.plus(perfit).toString() + " " + balance2.plus(gasFee).toString())
            }

            return reserveBagInstance.setTeamPerfitAddress(teamPerfitForwarder.address, {from: account0})
        }).then(function(txReceipt) {
            assert.equal(txReceipt.receipt.status, '0x1', "setTeamPerfitAddress back to teamPerfitForwarder.address fail!");
            console.log("setTeamPerfitAddress back to teamPerfitForwarder.address successfully.");
        });
    });
});