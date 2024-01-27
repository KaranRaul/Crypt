// require("@nomicfoundation/hardhat-toolbox");

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.19",
// };

// https://eth-sepolia.g.alchemy.com/v2/O5ts5bIpOP8XPUi-ASgon_tv5whcyG_F

require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.9',
  networks: {
    sepolia: {
      url: 'https://eth-sepolia.g.alchemy.com/v2/O5ts5bIpOP8XPUi-ASgon_tv5whcyG_F',
      accounts: ['06bccf5c8966b60ee913589e12244779c0ac594e671cb1653eddbba6ea145723']
    }
  }
}
