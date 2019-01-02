var playBook = artifacts.require("PlayerBook");
var reserveBag = artifacts.require("ReserveBag");
var drsCoin = artifacts.require("DRSCoin")
var teamPerfitForwarder = artifacts.require("TeamPerfitForwarder")
var BigNumber = require('bignumber.js')

contract('DRSCoin', function(accounts) {
    var keyPrices = new Array(50)
    var price = new BigNumber(Math.pow(10, 18))
    var totalInput = new BigNumber(0)

    var myGasPrice = 22000000000
    var registerNameFee = new BigNumber(10).pow(16)

    console.log("keyPrices ============================")
    for(var i = 0; i < 50; i++)
    {
        keyPrices[i] = price
        console.log("price " + i, price.toString())
        price = new BigNumber(price.multipliedBy(1008).dividedBy(1000).toFixed(0, BigNumber.ROUND_FLOOR))
    }
    console.log("keyPrices ============================")

    it("test drsCoin perfit", function() {
        console.log("begin to test drsCoin perfit");

        this.timeout(100000);

        var account0 = accounts[0];
        var account1 = accounts[1];
        var account2 = accounts[2];

        var playBookInstance;
        var reserveBagInstance;
        var teamPerfitForwarderInstance;
        var fCoin;

        var genTotal = new BigNumber(0)
        var pot = new BigNumber(0)
        var teamPerfitTotal = new BigNumber(0)
        var account1rawBalance = new BigNumber(0)

        var drsCoinMint0 = new BigNumber(0)
        var drsCoinMint2 = new BigNumber(0)

        var drsCoinBalance0 = new BigNumber(0)

        var ethPerfit = new BigNumber(0)

        console.log("account0: ", account0)
        console.log("account1: ", account1)
        console.log("account2: ", account2)

        return playBook.deployed({from: account0}).then(function(instance) {
            playBookInstance = instance;
            console.log("playBookInstance address: ", playBookInstance.address)

            return reserveBag.deployed(teamPerfitForwarder.address, playBookInstance.address, drsCoin.address, {from: account0});
        }).then(function(instance) {
            reserveBagInstance = instance;
            console.log("reserveBagInstance address: ", reserveBagInstance.address)

            return drsCoin.deployed({from: account0})
        }).then(async function(instance) {
            fCoin = instance

            await fCoin.proposeGame(reserveBag.address, {from: account0})

            var start = new Date().getTime();
            while (new Date().getTime() < start + 3000);

            await fCoin.addGame(reserveBag.address, {from: account0})

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

            let _eth = await web3.eth.getBalance(account1)
            console.log("account1: ", account1, ", _eth: ", _eth.toString())
            teamPerfitTotal = new BigNumber(_eth)
            account1rawBalance = teamPerfitTotal

            var buyKeyTimes = 39

            for(var i = 0; i < buyKeyTimes; i++) {
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
                console.log(i.toString(), "price:", bigNumberPrice.toString(), "pot:", roundInfo[3].toString(), "gas:", txReceipt.receipt.gasUsed)

                if(!pot.isEqualTo(roundInfo[3].toString())) {
                    assert(false, "pot incorrect! " + i + pot.toString() + " " + roundInfo[3].toString())
                }

                _eth = await web3.eth.getBalance(account1)
                if(!teamPerfitTotal.isEqualTo(_eth.toString())) {
                    assert(false, "teamPerfitTotal incorrect! " + i + teamPerfitTotal.toString() + " " + _eth.toString())
                }

                if(i >= 36) {
                    let playerInfo = await reserveBagInstance.getPlayerInfoByAddress(account0)
                    // console.log(i.toString(), "gen:", playerInfo[4].toString())

                    if(!genTotal.isEqualTo(playerInfo[4].toString())) {
                        assert(false, "gen incorrect! " + i + genTotal.toString() + playerInfo[4].toString())
                    }
                }

                if(i >= buyKeyTimes - 36 && i != buyKeyTimes - 1) {
                    drsCoinMint0 = drsCoinMint0.plus(keyPrices[i].times(500))
                    // console.log("buy key", i, " mint drs: ", keyPrices[i].times(500).toString())
                }
            }
        }).then(async function() {
            // sleep 8 seconds
            var start = new Date().getTime();
            while (new Date().getTime() < start + 8000);

            let roundInfo = await reserveBagInstance.getCurrentRoundInfo.call()
            console.log("round info 1: ", roundInfo)

            console.log("current time: ", (new Date()).getTime() / 1000)

            let account0Balance = await web3.eth.getBalance(account0)
            console.log("account0 address: ", account0, ", balance: ", account0Balance.toString())

            let txReceipt = await reserveBagInstance.buyKey({from: account0, value: keyPrices[0].toString(), gas: 6000000})
            console.log("last buyKey gas:", txReceipt.receipt.gasUsed)

            assert.equal(txReceipt.receipt.status, '0x1', "reserveBagInstance buyKey last fail!")

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
            console.log("new pot: ", newPot.toString())

            pot = newPot

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
            ethPerfit = ethPerfit.plus(drsCoinDevidend)

            var total = new BigNumber(teamPerfitOwn).plus(reserveBagBalance).plus(drsCoinPerfit)
            if(!totalInput.isEqualTo(total)) {
                assert(false, "totalInput incorrect! " + totalInput.toString() + " " + total.toString())
            }

            drsCoinBalance0 = drsCoinPerfit

            let drsCoinBal0 = await fCoin.balanceOf(account0)
            console.log("drsCoinBal0: ", drsCoinBal0.toString())

            if(!new BigNumber(drsCoinBal0).isEqualTo(drsCoinMint0)) {
                assert(false, "account0 drs coin mint incorrect! " + drsCoinBal0.toString() + " " + drsCoinMint0.toString())
            }
        }).then(async function() {
            var pricei
            var gen
            var left

            genTotal = new BigNumber(0)
            totalInput = pot

            let _eth = await web3.eth.getBalance(account1)
            console.log("account1: ", account1, ", _eth: ", _eth.toString())
            teamPerfitTotal = new BigNumber(_eth)
            account1rawBalance = teamPerfitTotal

            var buyKeyTimes = 42

            for(var i = 0; i < buyKeyTimes; i++) {
                let price = await reserveBagInstance.getBuyPrice()

                var bigNumberPrice = BigNumber(price)
                if(!bigNumberPrice.isEqualTo(keyPrices[i])) {
                    assert(false, "key price incorrect! " + i)
                }

                let txReceipt = await reserveBagInstance.buyKey({from: account2, value: keyPrices[i].toString()})
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

                // console.log("222 gen:", gen, "teamPerfit:", teamPerfit, "left:", left.toString())

                teamPerfitTotal = teamPerfitTotal.plus(teamPerfit)
                pot = pot.plus(left)

                let roundInfo = await reserveBagInstance.getCurrentRoundInfo()
                console.log(i.toString(), "price:", bigNumberPrice.toString(), "pot:", roundInfo[3].toString(), "gas:", txReceipt.receipt.gasUsed)

                if(!pot.isEqualTo(roundInfo[3].toString())) {
                    assert(false, "pot incorrect! " + i + " " + pot.toString() + " " + roundInfo[3].toString())
                }

                _eth = await web3.eth.getBalance(account1)
                if(!teamPerfitTotal.isEqualTo(_eth.toString())) {
                    assert(false, "teamPerfitTotal incorrect! " + i + teamPerfitTotal.toString() + " " + _eth.toString())
                }

                if(i >= 36) {
                    let playerInfo = await reserveBagInstance.getPlayerInfoByAddress(account2)
                    // console.log(i.toString(), "gen:", playerInfo[4].toString())

                    if(!genTotal.isEqualTo(playerInfo[4].toString())) {
                        assert(false, "gen incorrect! " + i + " " + genTotal.toString() + " " + playerInfo[4].toString())
                    }
                }

                if(i >= buyKeyTimes - 36 && i != buyKeyTimes - 1) {
                    drsCoinMint2 = drsCoinMint2.plus(keyPrices[i].times(500))
                    console.log("account2 buy key", i, " mint drs: ", keyPrices[i].times(500).toString())
                }
            }
        }).then(async function() {
            // sleep 8 seconds
            var start = new Date().getTime();
            while (new Date().getTime() < start + 8000);

            let roundInfo = await reserveBagInstance.getCurrentRoundInfo.call()
            console.log("round info 1: ", roundInfo)

            console.log("current time: ", (new Date()).getTime() / 1000)

            let account2Balance = await web3.eth.getBalance(account2)
            console.log("account2 address: ", account2, ", balance: ", account2Balance.toString())

            let txReceipt = await reserveBagInstance.buyKey({from: account2, value: keyPrices[0].toString(), gas: 6000000})
            console.log("last buyKey gas:", txReceipt.receipt.gasUsed)

            assert.equal(txReceipt.receipt.status, '0x1', "reserveBagInstance buyKey last fail!")

            totalInput = totalInput.plus(keyPrices[0])

            console.log("buyKey successfully in the last!")

            genTotal = genTotal.plus(keyPrices[0])

            let playerInfo = await reserveBagInstance.getPlayerInfoByAddress(account2)
            console.log("account2 gen:", playerInfo[4].toString())

            if(!genTotal.isEqualTo(playerInfo[4].toString())) {
                assert(false, "account2 gen incorrect in the last! " + genTotal.toString() + " " + playerInfo[4].toString())
            }

            console.log("win:", playerInfo[3].toString())

            var win = pot.dividedBy(2).toFixed(0, BigNumber.ROUND_FLOOR)
            var drsCoinDevidend = pot.multipliedBy(40).dividedBy(100).toFixed(0, BigNumber.ROUND_FLOOR)
            var teamPerfit = pot.multipliedBy(5).dividedBy(100).toFixed(0, BigNumber.ROUND_FLOOR)
            var newPot = pot.minus(win).minus(drsCoinDevidend).minus(teamPerfit)

            if(!new BigNumber(win).isEqualTo(playerInfo[3].toString())) {
                assert(false, "account2 winner's reward incorrect! " + win.toString() + " " + playerInfo[3].toString())
            }

            let rInfo = await reserveBagInstance.getCurrentRoundInfo.call()
            console.log("round info 2: ", rInfo)

            if(!new BigNumber(newPot).isEqualTo(rInfo[3].toString())) {
                assert(false, "new pot incorrect! " + newPot.toString() + " " + rInfo[3].toString())
            }
            console.log("new pot: ", newPot.toString())

            pot = newPot

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

            ethPerfit = ethPerfit.plus(drsCoinDevidend)

            if(!new BigNumber(drsCoinPerfit).isEqualTo(ethPerfit)) {
                assert(false, "ethPerfit incorrect! " + drsCoinPerfit.toString() + " " + ethPerfit.toString())
            }

            let drsCoinBal2 = await fCoin.balanceOf(account2)
            console.log("drsCoinBal2: ", drsCoinBal2.toString())

            if(!new BigNumber(drsCoinBal2).isEqualTo(drsCoinMint2)) {
                assert(false, "account2 drs coin mint incorrect! " + drsCoinBal2.toString() + " " + drsCoinMint2.toString())
            }
        }).then(async function() {
            // set time a month later
            await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [3600*24*32], id: 0})

            // just generate a block
            await reserveBagInstance.registerName("wwyx", true, {from: account1, value: registerNameFee.toString(), gasPrice: myGasPrice.toString()})

            let totalSupply = await fCoin.totalSupply()
            console.log("totalSupply:", totalSupply.toString())

            let drsCoinBal0 = await fCoin.balanceOf(account0)
            let drsCoinBal2 = await fCoin.balanceOf(account2)
            console.log("drsCoinBal0:", drsCoinBal0.toString(), "drsCoinBal2:", drsCoinBal2.toString())

            let drsCoinPerfit = await web3.eth.getBalance(drsCoin.address)
            console.log("drsCoin balance: ", drsCoinPerfit.toString())

            let account0Bal = await web3.eth.getBalance(account0)
            console.log("account0 balance: ", account0Bal.toString())
            let account2Bal = await web3.eth.getBalance(account2)
            console.log("account2 balance: ", account2Bal.toString())

            let perfitQuery0 = await fCoin.getEthPerfit(account0)
            let perfitQuery2 = await fCoin.getEthPerfit(account2)
            console.log("perfitQuery0:", perfitQuery0.toString(), "perfitQuery2:", perfitQuery2.toString())

            let receipt0 = await fCoin.withdraw({from: account0, gasPrice: myGasPrice})
            let receipt2 = await fCoin.withdraw({from: account2, gasPrice: myGasPrice})

            let gasUsed0 = receipt0.receipt.gasUsed
            let gasUsed2 = receipt2.receipt.gasUsed

            let account00Bal = await web3.eth.getBalance(account0)
            console.log("account00 balance: ", account0Bal.toString())
            let account22Bal = await web3.eth.getBalance(account2)
            console.log("account22 balance: ", account2Bal.toString())

            var perfit0 = new BigNumber(account00Bal).minus(account0Bal).plus(new BigNumber(gasUsed0).times(myGasPrice))
            var perfit2 = new BigNumber(account22Bal).minus(account2Bal).plus(new BigNumber(gasUsed2).times(myGasPrice))

            console.log("perfit0:", perfit0.toString(), "perfit2:", perfit2.toString(),
                "perfit0+perfit2:", new BigNumber(perfit0).plus(perfit2).toString())

            if(!new BigNumber(perfitQuery0).isEqualTo(perfit0)) {
                assert(false, "perfitQuery0 incorrect! " + perfitQuery0.toString() + " " + perfit0.toString())
            }

            if(!new BigNumber(perfitQuery2).isEqualTo(perfit2)) {
                assert(false, "perfitQuery2 incorrect! " + perfitQuery2.toString() + " " + perfit2.toString())
            }

            var p0 = new BigNumber(ethPerfit).times(drsCoinBal0).div(totalSupply).toFixed(0, BigNumber.ROUND_FLOOR)
            if(!new BigNumber(p0).isEqualTo(perfit0)) {
                assert(false, "perfit0 incorrect! " + p0.toString() + " " + perfit0.toString())
            }

            var p2 = new BigNumber(ethPerfit).times(drsCoinBal2).div(totalSupply).toFixed(0, BigNumber.ROUND_FLOOR)
            if(!new BigNumber(p2).isEqualTo(perfit2)) {
                assert(false, "perfit2 incorrect! " + p2.toString() + " " + perfit2.toString())
            }
        })
    })
});