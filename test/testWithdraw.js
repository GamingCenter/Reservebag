var playBook = artifacts.require("PlayerBook");
var reserveBag = artifacts.require("ReserveBag");
var drsCoin = artifacts.require("DRSCoin")
var teamPerfitForwarder = artifacts.require("TeamPerfitForwarder")
var BigNumber = require('bignumber.js')

contract('ReserveBag', function(accounts) {
    var keyPrices = new Array(40)
    var price = new BigNumber(Math.pow(10, 18))
    var totalInput = new BigNumber(0)

    console.log("keyPrices ============================")
    for(var i = 0; i < 40; i++)
    {
        keyPrices[i] = price
        console.log("price " + i, price.toString())
        price = new BigNumber(price.multipliedBy(1008).dividedBy(1000).toFixed(0, BigNumber.ROUND_FLOOR))
    }
    console.log("keyPrices ============================")

    it("test full test", function() {
        console.log("begin to test full test");

        this.timeout(50000);

        var account0 = accounts[0];
        var account1 = accounts[1];

        var myGasPrice = 22000000000

        var playBookInstance;
        var reserveBagInstance;
        var teamPerfitForwarderInstance;
        var fCoin

        var genTotal = new BigNumber(0)
        var pot = new BigNumber(0)
        var teamPerfitTotal = new BigNumber(0)
        var account1rawBalance = new BigNumber(0)

        console.log("account0: ", account0)
        console.log("account1: ", account1)

        return playBook.deployed({from: account0}).then(function(instance) {
            playBookInstance = instance;
            console.log("playBookInstance address: ", playBookInstance.address)

            return drsCoin.deployed({from: account0})
        }).then(async function(instance) {
            fCoin = instance

            await fCoin.proposeGame(reserveBag.address, {from: account0})

            var start = new Date().getTime();
            while (new Date().getTime() < start + 3000);

            await fCoin.addGame(reserveBag.address, {from: account0})

            return reserveBag.deployed(teamPerfitForwarder.address, playBookInstance.address, drsCoin.address, {from: account0});
        }).then(function(instance) {
            reserveBagInstance = instance;
            console.log("reserveBagInstance address: ", reserveBagInstance.address)

            return reserveBagInstance.getActivated()
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

            return teamPerfitForwarder.deployed({from: account0})
        }).then(function(instance) {
            teamPerfitForwarderInstance = instance
            return teamPerfitForwarderInstance.setTeamPerfitAddr(account1)
        }).then(function(txReceipt) {
            assert.equal(txReceipt.receipt.status, '0x1', "registerName fail!");
            console.log("setTeamPerfitAddr successfully.");

            return reserveBagInstance.registerName("aaabc", true, {from: account0, value: Math.pow(10, 16)})
        }).then(function(txReceipt) {
            assert.equal(txReceipt.receipt.status, '0x1', "registerName fail!");
            console.log("registerName successfully.");

            return reserveBagInstance.getCurrentRoundInfo.call()
        }).then(async function(info) {
            console.log("info1: ", info)

            var pricei
            var gen
            var left
            var ethWithdraw

            let _eth = await web3.eth.getBalance(account1)
            console.log("account1: ", account1, ", _eth: ", _eth.toString())
            teamPerfitTotal = new BigNumber(_eth)
            account1rawBalance = teamPerfitTotal

            for(var i = 0; i < 39; i++) {
                let price = await reserveBagInstance.getBuyPrice()

                var bigNumberPrice = BigNumber(price)
                if(!bigNumberPrice.isEqualTo(keyPrices[i])) {
                    assert(false, "key price incorrect! " + i)
                }

                let txReceipt = await reserveBagInstance.buyKey({from: account0, value: keyPrices[i].toString()})
                assert.equal(txReceipt.receipt.status, '0x1', "reserveBagInstance buyKey " + i + " fail!")

                totalInput = totalInput.plus(keyPrices[i])

                pricei = keyPrices[i]
                teamPerfit = pricei.dividedBy(50).toFixed(0, BigNumber.ROUND_FLOOR)
                if(i < 36) {
                    left = pricei.minus(teamPerfit)
                } else {
                    gen = pricei.multipliedBy(90).dividedBy(100).toFixed(0, BigNumber.ROUND_FLOOR)
                    left = pricei.minus(teamPerfit).minus(gen)
                    genTotal = genTotal.plus(gen)
                }

                teamPerfitTotal = teamPerfitTotal.plus(teamPerfit)
                pot = pot.plus(left)

                let roundInfo = await reserveBagInstance.getCurrentRoundInfo()
                console.log(i.toString(), "price:", bigNumberPrice.toString(), "pot:", roundInfo[3].toString())

                if(!pot.isEqualTo(roundInfo[3].toString())) {
                    assert(false, "pot incorrect! " + i + pot.toString() + " " + roundInfo[3].toString())
                }

                _eth = await web3.eth.getBalance(account1)
                if(!teamPerfitTotal.isEqualTo(_eth.toString())) {
                    assert(false, "teamPerfitTotal incorrect! " + i + teamPerfitTotal.toString() + " " + _eth.toString())
                }

                if(i >= 36) {
                    let playerInfo = await reserveBagInstance.getPlayerInfoByAddress(account0)
                    console.log(i.toString(), "gen:", playerInfo[4].toString())

                    if(!genTotal.isEqualTo(playerInfo[4].toString())) {
                        assert(false, "gen incorrect! " + i + genTotal.toString() + playerInfo[4].toString())
                    }

                    if(i == 38) {
                        ethWithdraw = new BigNumber(playerInfo[4])
                    }
                }
            }

            let account0Balance1 = await web3.eth.getBalance(account0)
            console.log("account0 address: ", account0, ", balance: ", account0Balance1.toString())

            let txReceipt = await reserveBagInstance.withdraw({from: account0, gasPrice: myGasPrice})
            assert.equal(txReceipt.receipt.status, '0x1', "reserveBagInstance.withdraw 1 fail!")
            var gasUsed = txReceipt.receipt.gasUsed

            let account0Balance2 = await web3.eth.getBalance(account0)
            console.log("account0 address: ", account0, ", balance: ", account0Balance2.toString())

            var total1 = new BigNumber(account0Balance1).plus(ethWithdraw)
            var total2 = new BigNumber(account0Balance2).plus(new BigNumber(gasUsed).multipliedBy(myGasPrice))
            if(!total1.isEqualTo(total2)) {
                assert(false, "withdraw eth incorrect! " + total1.toString() + " " + total2.toString())
            }

            genTotal = genTotal.minus(ethWithdraw)
        }).then(async function() {
            // sleep 20 seconds
            var start = new Date().getTime();
            while (new Date().getTime() < start + 20000);

            let roundInfo = await reserveBagInstance.getCurrentRoundInfo.call()
            console.log("round info 1: ", roundInfo)

            console.log("current time: ", (new Date()).getTime() / 1000)

            let txReceipt = await reserveBagInstance.buyKey({from: account0, value: keyPrices[0].toString()})
            assert.equal(txReceipt.receipt.status, '0x1', "reserveBagInstance buyKey " + i + " fail!")

            totalInput = totalInput.plus(keyPrices[0])

            console.log("buyKey successfully in the last!")

            genTotal = genTotal.plus(keyPrices[0])

            let playerInfo = await reserveBagInstance.getPlayerInfoByAddress(account0)
            console.log("gen:", playerInfo[4].toString())

            if(!genTotal.isEqualTo(playerInfo[4].toString())) {
                assert(false, "gen incorrect in the last! " + genTotal.toString() + " " + playerInfo[4].toString())
            }

            console.log("win:", playerInfo[3].toString())

            var win = pot.dividedBy(2).toFixed(0, BigNumber.ROUND_FLOOR)
            var drsCoinDevidend = pot.multipliedBy(40).dividedBy(100).toFixed(0, BigNumber.ROUND_FLOOR)
            var teamPerfit = pot.multipliedBy(5).dividedBy(100).toFixed(0, BigNumber.ROUND_FLOOR)
            var newPot = pot.minus(win).minus(drsCoinDevidend).minus(teamPerfit)

            if(!new BigNumber(win).isEqualTo(playerInfo[3].toString())) {
                assert(false, "winner's reward incorrect! " + win.toString() + " " + playerInfo[3].toString())
            }

            let rInfo = await reserveBagInstance.getCurrentRoundInfo.call()
            console.log("round info 2: ", rInfo)

            if(!new BigNumber(newPot).isEqualTo(rInfo[3].toString())) {
                assert(false, "new pot incorrect! " + newPot.toString() + " " + rInfo[3].toString())
            }

            teamPerfitTotal = teamPerfitTotal.plus(teamPerfit)
            let _eth = await web3.eth.getBalance(account1)
            if(!teamPerfitTotal.isEqualTo(_eth.toString())) {
                assert(false, "teamPerfitTotal incorrect in the last! "+ teamPerfitTotal.toString() + " " + _eth.toString())
            }
            var teamPerfitOwn = teamPerfitTotal.minus(account1rawBalance)
            console.log("team perfit: ", teamPerfitOwn.toString())

            let reserveBagBalance = await web3.eth.getBalance(reserveBag.address)
            console.log("reserveBag address: ", reserveBag.address, ", balance: ", reserveBagBalance.toString())

            let drsCoinPerfit = await web3.eth.getBalance(drsCoin.address)
            console.log("drsCoin address: ", drsCoin.address, ", balance: ", drsCoinPerfit.toString())
            if(!new BigNumber(drsCoinDevidend).isEqualTo(drsCoinPerfit)) {
                assert(false, "drs coin devidend incorrect! " + drsCoinDevidend.toString() + " " + drsCoinPerfit.toString())
            }

            // test withdraw at the end of a round
            let account0Balance1 = await web3.eth.getBalance(account0)
            console.log("account0 before withdraw address: ", account0, ", balance: ", account0Balance1.toString())

            txReceipt = await reserveBagInstance.withdraw({from: account0, gasPrice: myGasPrice})
            assert.equal(txReceipt.receipt.status, '0x1', "reserveBagInstance.withdraw 1 fail!")
            var gasUsed = txReceipt.receipt.gasUsed

            let account0Balance2 = await web3.eth.getBalance(account0)
            console.log("account0 after withdraw address: ", account0, ", balance: ", account0Balance2.toString())

            var total1 = new BigNumber(account0Balance1).plus(genTotal).plus(win)
            var total2 = new BigNumber(account0Balance2).plus(new BigNumber(gasUsed).multipliedBy(myGasPrice))
            if(!total1.isEqualTo(total2)) {
                assert(false, "withdraw eth incorrect in the last! " + total1.toString() + " " + total2.toString())
            }
            console.log("withdraw in the last: ", genTotal.plus(win).toString())
        })
    })
});