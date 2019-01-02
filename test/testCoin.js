var drsCoin = artifacts.require("DRSCoin")
var drsCoinTest = artifacts.require("DRSCoinTestContract")
var BigNumber = require('bignumber.js')

contract('Coin', function(accounts) {
    it("mint coin test", function() {
        console.log("begin to mint coin test");

        var account0 = accounts[0];
        var account1 = accounts[1];
        var account2 = accounts[2];
        var account3 = accounts[3];

        console.log("account0: ", account0)
        console.log("account1: ", account1)
        console.log("account2: ", account2)
        console.log("account3: ", account3)

        var fCoin
        var fCoinTest

        return drsCoin.deployed({from: account0}).then(function(instance) {
            console.log("drsCoin address: ", drsCoin.address)

            fCoin = instance
            return drsCoinTest.deployed(drsCoin.address, {from: account0})
        }).then(async function(instance) {
            console.log("drsCoinTest address: ", drsCoinTest.address)
            var fCoinTest = instance

            await fCoin.proposeGame(drsCoinTest.address, {from: account0})

            var start = new Date().getTime();
            while (new Date().getTime() < start + 3000);

            await fCoin.addGame(drsCoinTest.address, {from: account0})

            console.log("addGame successfully.")

            // mint 8000 eth
            let txReceipt = await fCoinTest.mintDRSCoin(account1, 8000 * Math.pow(10, 18), {from: account0});
            assert.equal(txReceipt.receipt.status, '0x1', "mint fail!")
            console.log("mint successfully.")

            let balance = await fCoin.balanceOf(account1)
            var bal = new BigNumber(8000 * 500).times(new BigNumber(10).pow(18))
            if(!bal.isEqualTo(balance)) {
                assert(false, "balance incorrect! " + bal.toString() + " " + balance.toString())
            }
            console.log("8000 eth mint:", bal.toString())

            let totalSupply = await fCoin.totalSupply()
            var tSupply = new BigNumber(8000 * 500).times(new BigNumber(10).pow(18))
            if(!tSupply.isEqualTo(totalSupply)) {
                assert(false, "totalSupply incorrect! " + tSupply.toString() + " " + totalSupply.toString())
            }

            let tokenExchangeRate = await fCoin.tokenExchangeRate()
            var exchangeRate = new BigNumber(500)
            if(!exchangeRate.isEqualTo(tokenExchangeRate)) {
                assert(false, "tokenExchangeRate incorrect! " + exchangeRate.toString() + " " + tokenExchangeRate.toString())
            }

            let nextReduceSupply = await fCoin.nextReduceSupply()
            var nextReduce = new BigNumber(5000000).times(new BigNumber(10).pow(18))
            if(!nextReduce.isEqualTo(nextReduceSupply)) {
                assert(false, "nextReduceSupply incorrect! " + nextReduce.toString() + " " + nextReduceSupply.toString())
            }

            // mint 4000 eth
            txReceipt = await fCoinTest.mintDRSCoin(account2, 4000 * Math.pow(10, 18), {from: account0});
            assert.equal(txReceipt.receipt.status, '0x1', "mint 2 fail!")
            console.log("mint 2 successfully.")

            tokenExchangeRate = await fCoin.tokenExchangeRate()
            exchangeRate = new BigNumber(new BigNumber(500).times(9).div(10).toFixed(0, BigNumber.ROUND_FLOOR))
            if(!exchangeRate.isEqualTo(tokenExchangeRate)) {
                assert(false, "tokenExchangeRate 2 incorrect! " + exchangeRate.toString() + " " + tokenExchangeRate.toString())
            }

            balance = await fCoin.balanceOf(account2)
            var bal1 = new BigNumber(2000 * 500).times(new BigNumber(10).pow(18))
            var bal2 = new BigNumber(2000).times(new BigNumber(10).pow(18)).times(exchangeRate).toFixed(0, BigNumber.ROUND_FLOOR)
            bal = bal1.plus(bal2)
            if(!bal.isEqualTo(balance)) {
                assert(false, "balance 2 incorrect! " + bal.toString() + " " + balance.toString())
            }
            console.log("4000 eth mint:", bal.toString())

            let totalSupply2 = await fCoin.totalSupply()
            tSupply = new BigNumber(totalSupply.plus(bal))
            if(!tSupply.isEqualTo(totalSupply2)) {
                assert(false, "totalSupply 2 incorrect! " + tSupply.toString() + " " + totalSupply2.toString())
            }

            nextReduceSupply = await fCoin.nextReduceSupply()
            nextReduce = new BigNumber(10000000).times(new BigNumber(10).pow(18))
            if(!nextReduce.isEqualTo(nextReduceSupply)) {
                assert(false, "nextReduceSupply 2 incorrect! " + nextReduce.toString() + " " + nextReduceSupply.toString())
            }

            // mint 22000 eth
            var ethTotal = new BigNumber(22000).times(new BigNumber(Math.pow(10, 18)))
            txReceipt = await fCoinTest.mintDRSCoin(account3, ethTotal.toString(), {from: account0});
            assert.equal(txReceipt.receipt.status, '0x1', "mint 3 fail!")
            console.log("mint 3 successfully.")

            console.log("ethTotal: ", ethTotal.toString())
            var exchangeRate1 = tokenExchangeRate
            var eth1 = nextReduce.minus(tSupply).div(exchangeRate1).toFixed(0, BigNumber.ROUND_FLOOR)
            var exchangeRate2 = new BigNumber(exchangeRate1.times(9).div(10).toFixed(0, BigNumber.ROUND_FLOOR))
            var eth2 = new BigNumber(5000000).times(new BigNumber(10).pow(18)).div(exchangeRate2).toFixed(0, BigNumber.ROUND_FLOOR)
            var exchangeRate3 = new BigNumber(exchangeRate2.times(9).div(10).toFixed(0, BigNumber.ROUND_FLOOR))
            var eth3 = ethTotal.minus(eth1).minus(eth2)
            console.log("eth1:", eth1.toString(), " eth2:", eth2.toString(), " eth3:", eth3.toString())
            console.log("exchangeRate1:", exchangeRate1.toString(), " exchangeRate2:", exchangeRate2.toString(),
                " exchangeRate3:", exchangeRate3.toString())

            var mint1 = nextReduce.minus(tSupply)
            var mint2 = new BigNumber(5000000).times(new BigNumber(10).pow(18))
            var mint3 = new BigNumber(eth3.times(exchangeRate3).toFixed(0, BigNumber.ROUND_FLOOR))
            var mintTotal = mint1.plus(mint2).plus(mint3)
            console.log("mint1:", mint1.toString(), " mint2:", mint2.toString(), " mint3:", mint3.toString())

            tokenExchangeRate = await fCoin.tokenExchangeRate()
            if(!exchangeRate3.isEqualTo(tokenExchangeRate)) {
                assert(false, "tokenExchangeRate 3 incorrect! " + exchangeRate3.toString() + " " + tokenExchangeRate.toString())
            }

            balance = await fCoin.balanceOf(account3)
            if(!mintTotal.isEqualTo(balance)) {
                assert(false, "balance 3 incorrect! " + mintTotal.toString() + " " + balance.toString())
            }
            console.log("20000 eth mint:", mintTotal.toString())

            let totalSupply3 = await fCoin.totalSupply()
            tSupply = new BigNumber(totalSupply2.plus(mintTotal))
            if(!tSupply.isEqualTo(totalSupply3)) {
                assert(false, "totalSupply 3 incorrect! " + tSupply.toString() + " " + totalSupply3.toString())
            }

            nextReduceSupply = await fCoin.nextReduceSupply()
            nextReduce = new BigNumber(20000000).times(new BigNumber(10).pow(18))
            if(!nextReduce.isEqualTo(nextReduceSupply)) {
                assert(false, "nextReduceSupply 3 incorrect! " + nextReduce.toString() + " " + nextReduceSupply.toString())
            }
        });
    });
});