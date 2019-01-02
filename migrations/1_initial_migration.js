var playerBook = artifacts.require("PlayerBook")
var reserveBag = artifacts.require("ReserveBag")
var drsCoin = artifacts.require("DRSCoin")
var teamPerfitForwarder = artifacts.require("TeamPerfitForwarder")
var drsCoinTest = artifacts.require("DRSCoinTestContract")

module.exports = function(deployer, network, accounts) {
	var pBook
	var fGame
	var fCoin
	var tpForwarder

	console.log("account0: ", accounts[0])
	// console.log("account1: ", accounts[1])

	deployer.deploy(teamPerfitForwarder, {from: accounts[0]}).then(function(instance) {
		tpForwarder = instance
		console.log("finish deploying teamPerfitForwarder, teamPerfitForwarder address: ", teamPerfitForwarder.address)

	// 	return tpForwarder.setTeamPerfitAddr(accounts[1], {from: accounts[0]})
	// }).then(function(txReceipt) {
	// 	console.log("txReceipt.receipt.status: ", txReceipt.receipt.status);

	// 	return tpForwarder.status()
	// }).then(function(res) {
	// 	console.log("account1: ", res[0], " account0: ", res[1])

		return deployer.deploy(drsCoin, {from: accounts[0]})
	}).then(function(instance) {
		fCoin = instance;
		console.log("finish deploying drsCoin, drsCoin address: ", drsCoin.address)

	// 	return deployer.deploy(drsCoinTest, drsCoin.address, {from: accounts[0]})
	// }).then(function(instance) {
	// 	console.log("finish deploying drsCoinTest, drsCoinTest address: ", drsCoinTest.address)

		return deployer.deploy(playerBook, {from: accounts[0]})
	}).then(function(instance) {
		pBook = instance;
		console.log("finish deploying playerBook, playerBook address: ", playerBook.address)

		return deployer.deploy(reserveBag, teamPerfitForwarder.address, playerBook.address, drsCoin.address, {from: accounts[0]})
	}).then(function(instance) {
		fGame = instance
		console.log("finish deploying reserveBag, reserveBag address: ", reserveBag.address)

		return pBook.addGame(reserveBag.address, "fomogame", {from: accounts[0]})
	}).then(function(txReceipt) {
		console.log("playerBook addGame txReceipt.receipt.status: ", txReceipt.receipt.status);

		// return fCoin.proposeGame(reserveBag.address, {from: accounts[0]})
	});
};
