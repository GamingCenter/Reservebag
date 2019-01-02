var playBook = artifacts.require("PlayerBook");
var reserveBag = artifacts.require("ReserveBag");
var drsCoin = artifacts.require("DRSCoin")
var teamPerfitForwarder = artifacts.require("TeamPerfitForwarder")
var BigNumber = require('bignumber.js')

contract('ReserveBag', function(accounts) {
    var keyPrices = new Array(502)
    var price = new BigNumber(Math.pow(10, 16))
    var totalInput = new BigNumber(0)
	var n = 0 ;

    console.log("keyPrices ============================")
    for(var i = 0; i < 502; i++)
    {
        keyPrices[i] = price
        console.log("price " + i, price.toString())
        price = new BigNumber(price.multipliedBy(1008).dividedBy(1000).toFixed(0, BigNumber.ROUND_FLOOR))
    }
    console.log("keyPrices ============================")
    
    it("test full test", function(n) {
		
        console.log("begin to test full test");

        this.timeout(8000000);

        var account0 = accounts[0];
        var account1 = accounts[1];

        var myGasPrice = 2200000000

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
			let timeS1 = await web3.eth.getBlock(web3.eth.blockNumber).timestamp
		    console.log("timeS: ", timeS1)
		    await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [172800], id: 0})
            await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0})
		    let timeN1 = await web3.eth.getBlock(web3.eth.blockNumber).timestamp
		    console.log("timeN1: ", timeN1)

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
			
			let timeS = await web3.eth.getBlock(web3.eth.blockNumber).timestamp
		    console.log("timeS: ", timeS)
		    await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [2693000], id: 0})
            await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0})
		    let timeN = await web3.eth.getBlock(web3.eth.blockNumber).timestamp
		    console.log("timeN: ", timeN)

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

                

                _eth = await web3.eth.getBalance(account1)
                if(!teamPerfitTotal.isEqualTo(_eth.toString())) {
                    assert(false, "teamPerfitTotal incorrect! " + i + teamPerfitTotal.toString() + " " + _eth.toString())
                }

                if(i == 101) {
                    let timeleft = await reserveBagInstance.getTimeLeft()
                    console.log(i.toString(), "timeleft:", timeleft.toString())
        
                    if(!new BigNumber(timeleft).isEqualTo(new BigNumber(43200))) {
                        assert(false, "gen incorrect! " + i + timeleft.toString())
                    }

                }else if (i == 201){
					let timeleft = await reserveBagInstance.getTimeLeft()
                    console.log(i.toString(), "timeleft:", timeleft.toString())
        
                    if(!new BigNumber(timeleft).isEqualTo(new BigNumber(21600))) {
                        assert(false, "gen incorrect! " + i + timeleft.toString())
                    }
				}else if (i== 301){
					let timeleft = await reserveBagInstance.getTimeLeft()
                    console.log(i.toString(), "timeleft:", timeleft.toString())
        
                    if(!new BigNumber(timeleft).isEqualTo(new BigNumber(10800))) {
                        assert(false, "gen incorrect! " + i + timeleft.toString())
                    }
				}else if (i== 401){
					let timeleft = await reserveBagInstance.getTimeLeft()
                    console.log(i.toString(), "timeleft:", timeleft.toString())
        
                    if(!new BigNumber(timeleft).isEqualTo(new BigNumber(10800))) {
                        assert(false, "gen incorrect! " + i + timeleft.toString())
                    }
				}else if (i== 501){
					let timeleft = await reserveBagInstance.getTimeLeft()
                    console.log(i.toString(), "timeleft:", timeleft.toString())
        
                    if(!new BigNumber(timeleft).isEqualTo(new BigNumber(10800))) {
                        assert(false, "gen incorrect! " + i + timeleft.toString())
                    }
				}
				}
            

            /*let account0Balance1 = await web3.eth.getBalance(account0)
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

            genTotal = genTotal.minus(ethWithdraw)*/
        }).then(async function() {
            // sleep 20 seconds
            var start = new Date().getTime();
			let timeS = await web3.eth.getBlock(web3.eth.blockNumber).timestamp
		    console.log("timeS: ", timeS)
			timeS = await web3.eth.getBlock(web3.eth.blockNumber).timestamp
		    console.log("timeS: ", timeS)
		    await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [86432], id: 0})
            await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0})
		    timeN = await web3.eth.getBlock(web3.eth.blockNumber).timestamp
		    console.log("timeN: ", timeN)
			let timeleft = await reserveBagInstance.getTimeLeft()
            console.log(i.toString(), "timeleft:", timeleft.toString())
        
            if(!new BigNumber(timeleft).isEqualTo(new BigNumber(0))) {
                assert(false, "gen incorrect! " + i + timeleft.toString())
               }

            let roundInfo = await reserveBagInstance.getCurrentRoundInfo.call()
            console.log("round info 1: ", roundInfo)

            console.log("current time: ", (new Date()).getTime() / 1000)

            let txReceipt = await reserveBagInstance.buyKey({from: account0, value: keyPrices[0].toString()})
            assert.equal(txReceipt.receipt.status, '0x1', "reserveBagInstance buyKey " + i + " fail!")
			 timeleft = await reserveBagInstance.getTimeLeft()
            console.log(i.toString(), "timeleft:", timeleft.toString())
        
            if(!new BigNumber(timeleft).isEqualTo(new BigNumber(86400))) {
                assert(false, "gen incorrect! " + i + timeleft.toString())
               }
			txReceipt = await reserveBagInstance.buyKey({from: account0, value: keyPrices[0].toString()})
            assert.equal(txReceipt.receipt.status, '0x1', "reserveBagInstance buyKey " + i + " fail!")
			 timeleft = await reserveBagInstance.getTimeLeft()
            console.log(i.toString(), "timeleft:", timeleft.toString())
        
            if(!new BigNumber(timeleft).isEqualTo(new BigNumber(86400))) {
                assert(false, "gen incorrect! " + i + timeleft.toString())
               }
			
        })
   
	})
});