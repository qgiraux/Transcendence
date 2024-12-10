/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	defaultNetwork: "hardhat",
	networks: {
		localhost: {
			url: "http://0.0.0.0:8545"
		},
		hardhat: {
			accounts: [
				{
					privateKey: process.env.ACCOUNT_SERVICE_KEY,
					balance: "10000000000000000000000",
				},
				{
					privateKey: process.env.ACCOUNT_USER_KEY,
					balance: "10000000000000000000000",
				},
			],
		},
	},
	solidity: "0.8.28",
};
