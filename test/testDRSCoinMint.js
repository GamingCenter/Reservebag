var playBook = artifacts.require("PlayerBook");
var reserveBag = artifacts.require("ReserveBag");
var drsCoin = artifacts.require("DRSCoin")
var teamPerfitForwarder = artifacts.require("TeamPerfitForwarder")
var BigNumber = require('bignumber.js')

contract('DRSCoin', function(accounts) {
    var keyPrices = new Array(50)
    var price = BigNumber(Math.pow(10, 18))
    var totalInput = BigNumber(0)

    var myGasPrice = 22000000000
    var registerNameFee = BigNumber(10).pow(16)

    console.log("keyPrices ============================")
    for(var i = 0; i < 50; i++)
    {
        keyPrices[i] = price
        console.log("price " + i, price.toString())
        price = BigNumber(price.multipliedBy(1008).dividedBy(1000).toFixed(0, BigNumber.ROUND_FLOOR))
    }
    console.log("keyPrices ============================")

    it("test drsCoin mint", function() {
        console.log("begin to test drsCoin mint");

        this.timeout(100000);

        var account0 = accounts[0];
        var account1 = accounts[1];
        var account2 = accounts[2];
        var account3 = accounts[3];
        var account4 = accounts[4];

        var playBookInstance;
        var reserveBagInstance;
        var teamPerfitForwarderInstance;
        var fCoin;

        var gens = [BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0)]
        var wins = [BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0)]
        var pot = BigNumber(0)
        var teamPerfitTotal = BigNumber(0)
        var account1rawBalance = BigNumber(0)

        var drsCoinMint = [BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0)]
        var index = 0

        var _eths = [BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0)]

        var ethPerfit = BigNumber(0)

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

            let _eth1 = await web3.eth.getBalance(account1)
            console.log("account1: ", account1, ", _eth1: ", _eth1.toString())
            teamPerfitTotal = BigNumber(_eth1)
            account1rawBalance = teamPerfitTotal

            let _eth2 = await web3.eth.getBalance(account2)
            _eths[2] = BigNumber(_eth2)
            console.log("account2: ", account2, ", _eth2: ", _eths[2].toString())

            let _eth3 = await web3.eth.getBalance(account3)
            _eths[3] = BigNumber(_eth3)
            console.log("account3: ", account3, ", _eth3: ", _eths[3].toString())

            let _eth4 = await web3.eth.getBalance(account4)
            _eths[4] = BigNumber(_eth4)
            console.log("account4: ", account4, ", _eth4: ", _eths[4].toString())

            var buyKeyTimes = 10

            for(var i = 0; i < buyKeyTimes; i++) {
                let price = await reserveBagInstance.getBuyPrice()

                index = i % 3 + 2

                var bigNumberPrice = BigNumber(price)
                if(!bigNumberPrice.isEqualTo(keyPrices[i])) {
                    assert(false, "key price incorrect! " + i)
                }

                let txReceipt = await reserveBagInstance.buyKey({from: accounts[index], value: keyPrices[i].toString(), gasPrice: myGasPrice})
                assert.equal(txReceipt.receipt.status, '0x1', "reserveBagInstance buyKey " + i + " fail!")

                _eths[index] = _eths[index].minus(BigNumber(txReceipt.receipt.gasUsed).times(myGasPrice))
                _eths[index] = _eths[index].minus(keyPrices[i])

                totalInput = totalInput.plus(keyPrices[i])

                pricei = keyPrices[i]
                teamPerfit = pricei.dividedBy(50).toFixed(0, BigNumber.ROUND_FLOOR)
                if(i < 36) {
                    left = pricei.minus(teamPerfit)
                } else {
                    gen = pricei.multipliedBy(90).dividedBy(100).toFixed(0, BigNumber.ROUND_FLOOR)
                    left = pricei.minus(teamPerfit).minus(gen)
                    gens[index] = gens[index].plus(gen)
                }

                teamPerfitTotal = teamPerfitTotal.plus(teamPerfit)
                pot = pot.plus(left)

                let roundInfo = await reserveBagInstance.getCurrentRoundInfo()
                console.log(i.toString(), "price:", bigNumberPrice.toString(), "pot:", roundInfo[3].toString(), "gas:", txReceipt.receipt.gasUsed)

                if(!pot.isEqualTo(roundInfo[3].toString())) {
                    assert(false, "pot incorrect! " + i + pot.toString() + " " + roundInfo[3].toString())
                }

                _eth1 = await web3.eth.getBalance(account1)
                if(!teamPerfitTotal.isEqualTo(_eth1.toString())) {
                    assert(false, "teamPerfitTotal incorrect! " + i + teamPerfitTotal.toString() + " " + _eth1.toString())
                }

                if(i != buyKeyTimes - 1) {
                    drsCoinMint[index] = drsCoinMint[index].plus(keyPrices[i].times(500))
                    console.log("player ", index, " buy key", i, " mint drs: ", keyPrices[i].times(500).toString())
                }
            }

            _eth2 = await web3.eth.getBalance(account2)
            if(!_eths[2].isEqualTo(_eth2)) {
                assert(false, "_eth2 incorrect! " + _eths[2].toString() + " " + _eth2.toString())
            }

            _eth3 = await web3.eth.getBalance(account3)
            if(!_eths[3].isEqualTo(_eth3)) {
                assert(false, "_eth3 incorrect! " + _eths[3].toString() + " " + _eth3.toString())
            }

            _eth4 = await web3.eth.getBalance(account4)
            if(!_eths[4].isEqualTo(_eth4)) {
                assert(false, "_eth4 incorrect! " + _eths[4].toString() + " " + _eth4.toString())
            }
        }).then(async function() {
            // sleep 8 seconds
            var start = new Date().getTime();
            while (new Date().getTime() < start + 8000);

            let roundInfo = await reserveBagInstance.getCurrentRoundInfo.call()
            console.log("round info 1: ", roundInfo)

            console.log("current time: ", (new Date()).getTime() / 1000)

            let account1Balance = await web3.eth.getBalance(account1)
            console.log("account1 address: ", account1, ", balance: ", account1Balance.toString())

            let txReceipt = await reserveBagInstance.buyKey({from: account2, value: keyPrices[0].toString(), gas: 6000000, gasPrice: myGasPrice})
            assert.equal(txReceipt.receipt.status, '0x1', "reserveBagInstance buyKey last fail!")
            console.log("last buyKey gas:", txReceipt.receipt.gasUsed)

            _eths[2] = _eths[2].minus(BigNumber(txReceipt.receipt.gasUsed).times(myGasPrice))
            _eths[2] = _eths[2].minus(keyPrices[0])

            gens[2] = gens[2].plus(keyPrices[0])

            totalInput = totalInput.plus(keyPrices[0])

            console.log("buyKey successfully in the last!")

            let playerInfo2 = await reserveBagInstance.getPlayerInfoByAddress(account2)
            console.log("gen 2:", playerInfo2[4].toString())
            if(!gens[2].isEqualTo(playerInfo2[4].toString())) {
                assert(false, "gen 2 incorrect in the last! " + gens[2].toString() + " " + playerInfo2[4].toString())
            }
            console.log("win 2:", playerInfo2[3].toString())

            let playerInfo3 = await reserveBagInstance.getPlayerInfoByAddress(account3)
            console.log("gen 3:", playerInfo3[4].toString())
            if(!gens[3].isEqualTo(playerInfo3[4].toString())) {
                assert(false, "gen 3 incorrect in the last! " + gens[3].toString() + " " + playerInfo3[4].toString())
            }
            console.log("win 3:", playerInfo3[3].toString())

            let playerInfo4 = await reserveBagInstance.getPlayerInfoByAddress(account4)
            console.log("gen 4:", playerInfo4[4].toString())
            if(!gens[4].isEqualTo(playerInfo4[4].toString())) {
                assert(false, "gen 4 incorrect in the last! " + gens[4].toString() + " " + playerInfo4[4].toString())
            }
            console.log("win 3:", playerInfo4[3].toString())

            var win = pot.dividedBy(2).toFixed(0, BigNumber.ROUND_FLOOR)
            var drsCoinDevidend = pot.multipliedBy(40).dividedBy(100).toFixed(0, BigNumber.ROUND_FLOOR)
            var teamPerfit = pot.multipliedBy(5).dividedBy(100).toFixed(0, BigNumber.ROUND_FLOOR)
            var newPot = pot.minus(win).minus(drsCoinDevidend).minus(teamPerfit)

            if(!BigNumber(win).isEqualTo(playerInfo2[3].toString())) {
                assert(false, "winner's reward incorrect! " + win.toString() + " " + playerInfo2[3].toString())
            }

            wins[2] = wins[2].plus(win)

            let rInfo = await reserveBagInstance.getCurrentRoundInfo.call()
            console.log("round info 2: ", rInfo)

            if(!BigNumber(newPot).isEqualTo(rInfo[3].toString())) {
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
            if(!BigNumber(drsCoinDevidend).isEqualTo(drsCoinPerfit)) {
                assert(false, "drs coin devidend incorrect! " + drsCoinDevidend.toString() + " " + drsCoinPerfit.toString())
            }
            ethPerfit = ethPerfit.plus(drsCoinDevidend)

            var total = BigNumber(teamPerfitOwn).plus(reserveBagBalance).plus(drsCoinPerfit)
            if(!totalInput.isEqualTo(total)) {
                assert(false, "totalInput incorrect! " + totalInput.toString() + " " + total.toString())
            }

            let drsCoinBal2 = await fCoin.balanceOf(account2)
            console.log("drsCoinBal2: ", drsCoinBal2.toString())
            if(!BigNumber(drsCoinBal2).isEqualTo(drsCoinMint[2])) {
                assert(false, "account2 drs coin mint incorrect! " + drsCoinBal2.toString() + " " + drsCoinMint[2].toString())
            }

            let drsCoinBal3 = await fCoin.balanceOf(account3)
            console.log("drsCoinBal3: ", drsCoinBal3.toString())
            if(!BigNumber(drsCoinBal3).isEqualTo(drsCoinMint[3])) {
                assert(false, "account3 drs coin mint incorrect! " + drsCoinBal3.toString() + " " + drsCoinMint[3].toString())
            }

            let drsCoinBal4 = await fCoin.balanceOf(account4)
            console.log("drsCoinBal4: ", drsCoinBal4.toString())
            if(!BigNumber(drsCoinBal4).isEqualTo(drsCoinMint[4])) {
                assert(false, "account4 drs coin mint incorrect! " + drsCoinBal4.toString() + " " + drsCoinMint[4].toString())
            }
        }).then(async function() {
            var pricei
            var gen
            var left

            totalInput = pot

            let _eth = await web3.eth.getBalance(account1)
            console.log("account1: ", account1, ", _eth: ", _eth.toString())
            teamPerfitTotal = BigNumber(_eth)
            account1rawBalance = teamPerfitTotal

            var buyKeyTimes = 42

            for(var i = 0; i < buyKeyTimes; i++) {
                let price = await reserveBagInstance.getBuyPrice()

                index = i % 3 + 2

                var bigNumberPrice = BigNumber(price)
                if(!bigNumberPrice.isEqualTo(keyPrices[i])) {
                    assert(false, "key price incorrect! " + i)
                }

                let txReceipt = await reserveBagInstance.buyKey({from: accounts[index], value: keyPrices[i].toString(), gasPrice: myGasPrice})
                assert.equal(txReceipt.receipt.status, '0x1', "reserveBagInstance buyKey " + i + " fail!")

                _eths[index] = _eths[index].minus(BigNumber(txReceipt.receipt.gasUsed).times(myGasPrice))
                _eths[index] = _eths[index].minus(keyPrices[i])

                totalInput = totalInput.plus(keyPrices[i])

                pricei = keyPrices[i]
                teamPerfit = pricei.dividedBy(50).toFixed(0, BigNumber.ROUND_FLOOR)
                if(i < 36) {
                    left = pricei.minus(teamPerfit)
                } else {
                    gen = pricei.multipliedBy(90).dividedBy(100).toFixed(0, BigNumber.ROUND_FLOOR)
                    left = pricei.minus(teamPerfit).minus(gen)
                    gens[(i-36)%3+2] = gens[(i-36)%3+2].plus(gen)
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
                    if(!gens[2].isEqualTo(playerInfo[4].toString())) {
                        assert(false, "gen 2 incorrect! " + i + " " + gens[2].toString() + " " + playerInfo[4].toString())
                    }

                    playerInfo = await reserveBagInstance.getPlayerInfoByAddress(account3)
                    // console.log(i.toString(), "gen:", playerInfo[4].toString())
                    if(!gens[3].isEqualTo(playerInfo[4].toString())) {
                        assert(false, "gen 3 incorrect! " + i + " " + gens[3].toString() + " " + playerInfo[4].toString())
                    }

                    playerInfo = await reserveBagInstance.getPlayerInfoByAddress(account4)
                    // console.log(i.toString(), "gen:", playerInfo[4].toString())
                    if(!gens[4].isEqualTo(playerInfo[4].toString())) {
                        assert(false, "gen 4 incorrect! " + i + " " + gens[4].toString() + " " + playerInfo[4].toString())
                    }
                }

                if(i >= buyKeyTimes - 36 && i != buyKeyTimes - 1) {
                    drsCoinMint[index] = drsCoinMint[index].plus(keyPrices[i].times(500))
                    // console.log("account ", index, " buy key", i, " mint drs: ", keyPrices[i].times(500).toString())
                }
            }

            let balance2 = await web3.eth.getBalance(account2)
            if(!_eths[2].isEqualTo(balance2)) {
                assert(false, "111 account2 gen incorrect!" + _eths[2].toString() + " " + balance2.toString())
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

            let txReceipt = await reserveBagInstance.buyKey({from: account2, value: keyPrices[0].toString(), gas: 6000000, gasPrice: myGasPrice})
            assert.equal(txReceipt.receipt.status, '0x1', "reserveBagInstance buyKey last fail!")
            console.log("last buyKey gas:", txReceipt.receipt.gasUsed)

            _eths[2] = _eths[2].minus(BigNumber(txReceipt.receipt.gasUsed).times(myGasPrice))
            _eths[2] = _eths[2].minus(keyPrices[0])
            gens[2] = gens[2].plus(keyPrices[0])

            let balance2 = await web3.eth.getBalance(account2)
            if(!_eths[2].isEqualTo(balance2)) {
                assert(false, "account2 gen incorrect!" + _eths[2].toString() + " " + balance2.toString())
            }

            totalInput = totalInput.plus(keyPrices[0])

            console.log("buyKey successfully in the last!")

            let playerInfo2 = await reserveBagInstance.getPlayerInfoByAddress(account2)
            console.log("account2 gen:", playerInfo2[4].toString())
            if(!gens[2].isEqualTo(playerInfo2[4].toString())) {
                assert(false, "account2 gen incorrect in the last! " + gens[2].toString() + " " + playerInfo2[4].toString())
            }
            console.log("win 2:", playerInfo2[3].toString())

            let playerInfo3 = await reserveBagInstance.getPlayerInfoByAddress(account3)
            console.log("account3 gen:", playerInfo3[4].toString())
            if(!gens[3].isEqualTo(playerInfo3[4].toString())) {
                assert(false, "account3 gen incorrect in the last! " + gens[3].toString() + " " + playerInfo3[4].toString())
            }
            console.log("win 3:", playerInfo3[3].toString())

            let playerInfo4 = await reserveBagInstance.getPlayerInfoByAddress(account4)
            console.log("account4 gen:", playerInfo4[4].toString())
            if(!gens[4].isEqualTo(playerInfo4[4].toString())) {
                assert(false, "account3 gen incorrect in the last! " + gens[4].toString() + " " + playerInfo4[4].toString())
            }
            console.log("win 4:", playerInfo4[3].toString())

            var win = pot.dividedBy(2).toFixed(0, BigNumber.ROUND_FLOOR)
            var drsCoinDevidend = pot.multipliedBy(40).dividedBy(100).toFixed(0, BigNumber.ROUND_FLOOR)
            var teamPerfit = pot.multipliedBy(5).dividedBy(100).toFixed(0, BigNumber.ROUND_FLOOR)
            var newPot = pot.minus(win).minus(drsCoinDevidend).minus(teamPerfit)

            if(!BigNumber(win).isEqualTo(playerInfo4[3].toString())) {
                assert(false, "account2 winner's reward incorrect! " + win.toString() + " " + playerInfo4[3].toString())
            }

            wins[4] = wins[4].plus(win)

            let rInfo = await reserveBagInstance.getCurrentRoundInfo.call()
            console.log("round info 2: ", rInfo)

            if(!BigNumber(newPot).isEqualTo(rInfo[3].toString())) {
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

            if(!BigNumber(drsCoinPerfit).isEqualTo(ethPerfit)) {
                assert(false, "ethPerfit incorrect! " + drsCoinPerfit.toString() + " " + ethPerfit.toString())
            }

            let drsCoinBal2 = await fCoin.balanceOf(account2)
            console.log("drsCoinBal2: ", drsCoinBal2.toString())
            if(!BigNumber(drsCoinBal2).isEqualTo(drsCoinMint[2])) {
                assert(false, "account2 drs coin mint incorrect! " + drsCoinBal2.toString() + " " + drsCoinMint[2].toString())
            }

            let drsCoinBal3 = await fCoin.balanceOf(account3)
            console.log("drsCoinBal3: ", drsCoinBal3.toString())
            if(!BigNumber(drsCoinBal3).isEqualTo(drsCoinMint[3])) {
                assert(false, "account3 drs coin mint incorrect! " + drsCoinBal3.toString() + " " + drsCoinMint[3].toString())
            }

            let drsCoinBal4 = await fCoin.balanceOf(account4)
            console.log("drsCoinBal4: ", drsCoinBal4.toString())
            if(!BigNumber(drsCoinBal4).isEqualTo(drsCoinMint[4])) {
                assert(false, "account4 drs coin mint incorrect! " + drsCoinBal4.toString() + " " + drsCoinMint[4].toString())
            }

            let txReceipt2 = await reserveBagInstance.withdraw({from: account2, gas: 600000, gasPrice: myGasPrice})
            assert.equal(txReceipt2.receipt.status, '0x1', "reserveBagInstance withdraw fail!")
            _eths[2] = _eths[2].plus(gens[2]).plus(wins[2]).minus(BigNumber(txReceipt2.receipt.gasUsed).times(myGasPrice))
            let account2Bal = await web3.eth.getBalance(account2)
            if(!_eths[2].isEqualTo(account2Bal)) {
                assert(false, "eth 2 incorrect! " + _eths[2].toString() + " " + account2Bal.toString())
            }

            let txReceipt3 = await reserveBagInstance.withdraw({from: account3, gas: 600000, gasPrice: myGasPrice})
            assert.equal(txReceipt3.receipt.status, '0x1', "reserveBagInstance withdraw fail!")
            _eths[3] = _eths[3].plus(gens[3]).plus(wins[3]).minus(BigNumber(txReceipt3.receipt.gasUsed).times(myGasPrice))
            let account3Bal = await web3.eth.getBalance(account3)
            if(!_eths[3].isEqualTo(account3Bal)) {
                assert(false, "eth 3 incorrect! " + _eths[3].toString() + " " + account3Bal.toString())
            }

            let txReceipt4 = await reserveBagInstance.withdraw({from: account4, gas: 600000, gasPrice: myGasPrice})
            assert.equal(txReceipt4.receipt.status, '0x1', "reserveBagInstance withdraw fail!")
            _eths[4] = _eths[4].plus(gens[4]).plus(wins[4]).minus(BigNumber(txReceipt4.receipt.gasUsed).times(myGasPrice))
            let account4Bal = await web3.eth.getBalance(account4)
            if(!_eths[4].isEqualTo(account4Bal)) {
                assert(false, "eth 4 incorrect! " + _eths[4].toString() + " " + account4Bal.toString())
            }
        }).then(async function() {
            // set time a month later
            await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [3600*24*32], id: 0})

            // just generate a block
            await reserveBagInstance.registerName("wwyx", true, {from: account0, value: registerNameFee.toString(), gasPrice: myGasPrice})

            let totalSupply = await fCoin.totalSupply()
            console.log("totalSupply:", totalSupply.toString())

            let drsCoinBal2 = await fCoin.balanceOf(account2)
            let drsCoinBal3 = await fCoin.balanceOf(account3)
            let drsCoinBal4 = await fCoin.balanceOf(account4)
            console.log("drsCoinBal2:", drsCoinBal2.toString(), "drsCoinBal3:", drsCoinBal3.toString(), "drsCoinBal4:", drsCoinBal4.toString())

            let drsCoinPerfit = await web3.eth.getBalance(drsCoin.address)
            console.log("drsCoin balance: ", drsCoinPerfit.toString())

            let account2Bal = await web3.eth.getBalance(account2)
            console.log("account2 balance: ", account2Bal.toString())
            let account3Bal = await web3.eth.getBalance(account3)
            console.log("account3 balance: ", account3Bal.toString())
            let account4Bal = await web3.eth.getBalance(account4)
            console.log("account4 balance: ", account4Bal.toString())

            let perfitQuery2 = await fCoin.getEthPerfit(account2)
            let perfitQuery3 = await fCoin.getEthPerfit(account3)
            let perfitQuery4 = await fCoin.getEthPerfit(account4)
            console.log("perfitQuery2:", perfitQuery2.toString(), "perfitQuery3:", perfitQuery3.toString(), "perfitQuery4:", perfitQuery4.toString())

            let receipt2 = await fCoin.withdraw({from: account2, gasPrice: myGasPrice})
            let receipt3 = await fCoin.withdraw({from: account3, gasPrice: myGasPrice})
            let receipt4 = await fCoin.withdraw({from: account4, gasPrice: myGasPrice})

            let gasUsed2 = receipt2.receipt.gasUsed
            let gasUsed3 = receipt3.receipt.gasUsed
            let gasUsed4 = receipt4.receipt.gasUsed

            let account22Bal = await web3.eth.getBalance(account2)
            console.log("account22 balance: ", account2Bal.toString())
            let account33Bal = await web3.eth.getBalance(account3)
            console.log("account33 balance: ", account3Bal.toString())
            let account44Bal = await web3.eth.getBalance(account4)
            console.log("account44 balance: ", account4Bal.toString())

            var perfit2 = BigNumber(account22Bal).minus(account2Bal).plus(BigNumber(gasUsed2).times(myGasPrice))
            var perfit3 = BigNumber(account33Bal).minus(account3Bal).plus(BigNumber(gasUsed3).times(myGasPrice))
            var perfit4 = BigNumber(account44Bal).minus(account4Bal).plus(BigNumber(gasUsed4).times(myGasPrice))

            console.log("perfit2:", perfit2.toString(), "perfit3:", perfit3.toString(), "perfit4:", perfit4.toString(),
                "perfit2+perfit3+perfit4:", BigNumber(perfit2).plus(perfit3).plus(perfit4).toString())

            if(!BigNumber(perfitQuery2).isEqualTo(perfit2)) {
                assert(false, "perfitQuery2 incorrect! " + perfitQuery2.toString() + " " + perfit2.toString())
            }

            if(!BigNumber(perfitQuery3).isEqualTo(perfit3)) {
                assert(false, "perfitQuery3 incorrect! " + perfitQuery3.toString() + " " + perfit3.toString())
            }

            if(!BigNumber(perfitQuery4).isEqualTo(perfit4)) {
                assert(false, "perfitQuery4 incorrect! " + perfitQuery4.toString() + " " + perfit4.toString())
            }

            var p2 = BigNumber(ethPerfit).times(drsCoinBal2).div(totalSupply).toFixed(0, BigNumber.ROUND_FLOOR)
            if(!BigNumber(p2).isEqualTo(perfit2)) {
                assert(false, "perfit2 incorrect! " + p2.toString() + " " + perfit2.toString())
            }

            var p3 = BigNumber(ethPerfit).times(drsCoinBal3).div(totalSupply).toFixed(0, BigNumber.ROUND_FLOOR)
            if(!BigNumber(p3).isEqualTo(perfit3)) {
                assert(false, "perfit3 incorrect! " + p3.toString() + " " + perfit3.toString())
            }

            var p4 = BigNumber(ethPerfit).times(drsCoinBal4).div(totalSupply).toFixed(0, BigNumber.ROUND_FLOOR)
            if(!BigNumber(p4).isEqualTo(perfit4)) {
                assert(false, "perfit4 incorrect! " + p4.toString() + " " + perfit4.toString())
            }
        })
    })
});