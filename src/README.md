# Advanced Arbitrage Flash-loan System (A.F.A.S)

## Project Overview
This project aims to develop an advanced arbitrage system focused on the Binance Smart Chain (BSC). The goal is to identify and exploit arbitrage opportunities across various decentralized exchanges (DEXs) while ensuring efficient execution and minimizing risks associated with frontrunners and MEV bots.

## Project Structure
- **src/**: Contains source code files.
  - `config.js`: Configuration file for API keys and network settings.
  - `dataPull.js`: Script to fetch historical price data for specified tokens.
  - `testConnection.js`: Script to test the connection to the BNB Testnet.
  - `websocketManager.js`: Manages WebSocket connections for real-time data.
  - `arbitrageLogic.js`: Contains logic for detecting and executing arbitrage opportunities.
  - `utils.js`: Utility functions for calculations.

## Installation
1. Clone the repository.
2. Navigate to the project directory.
3. Run `npm install` to install dependencies.

## Usage
- To fetch historical price data, run `node src/dataPull.js`.
- To test the connection to the BNB Testnet, run `node src/testConnection.js`.

## DEX Router Addresses

- **PancakeSwap V3 Router**: 0x5c69bEe701ef814a2B6a3EDD96bA8C7c27f4bA85
- **PancakeSwap V2 Router**: 0x05fF8d2126E0063F96Dd4C3f7F27a7A72eC8d6aD
- **THENA FUSION**: 0x9c1e39313a3cd995462b70d1572e68fdd864404e
- **Uniswap V3 Router**: 0xe592427a0aece92d4e8c6a1e7e6a44d8b6e7b5c8
- **DODO Router**: 0x8eae292e44c5cfa3b3980f60e33eddd5d303951c
- **PancakeSwap (Stableswap)**: 0x0e37a0758a1c47b2d3fe5c6431464574f2f3b9dd
- **Unchain X Router**: 0x0b0d8e36bca0e207be33ff270a1397a61f9981cc
- **Nomiswap Router**: 0x73db91e2ae9a0439f5d3bc0ec402f7d4e98b88f7
- **PancakeSwap V1 Router**: 0x5c69bEe701ef814a2B6a3EDD96bA8C7c27f4bA85
- **Biswap V3 Router**: 0x04f3edc3bb42b4e7e9d8ffb05d50730ab8f3d82b
- **Biswap Router**: 0x16e209f2c7c34a78ac960d0aaf334da8be8468d3
- **Curve**: 0x1b0da3f35c5524991a61b2b54e39660b89c55ec7
- **THENA**: 0x86bcd3b21bbab4ab19bcbb719cc8e0208c8d50a2
- **Apeswap Router**: 0x95a30c30297a8245e497a1060c5f72ec0729c9b8
- **Babyswap Router**: 0x3c5fdd42fa8d2f60ef829b52987d56419e30db74
- **BakerySwap Router**: 0x3c6e1d9c6585f68b717c75c99f7a44145d2c422d
- **BabydodgeSwap Router**: 0x6d06f8b436ddcc01f98ad3434915f08316948f7a
- **SquadSwap V2 Router**: 0x6d8b24bb5e2cce6b03b6f30cd7f3c1e03043f4fa
- **Wombat Exchange Router**: 0x24014b4bb2a9a33c345897abb446c144c5e42376

## Trading Pairs Addresses

- **BNB**: 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173b2b1f7
- **CAKE (PancakeSwap Token)**: 0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82
- **XVS (Venus Protocol Token)**: 0x1e1e7e6f7d93cc67ffed9f842c7f35e18a92a70b
- **BAKE (BakerySwap Token)**: 0x6d1c3e17ed9920fd04c15c5c411d4692b0dfda3d
- **BURGER (BurgerSwap Token)**: 0x7130d2a12b9b241f502d7cbc10b04224e9b365f2
- **AUTO (AutoFarm Network Token)**: 0xB1b5fd4A3e13E3F4AC0Dbb340e72eD18B157c5E7
- **SUSHI (SushiSwap Token)**: 0x47a6e1646a90465c02bb62a2e67399b795e4b159
- **UNI (Uniswap Token)**: 0xb5c7b5a2dd21f7790f6d4a9c9b24dbf89e33a01b
- **1INCH (1inch Token)**: 0x111111111117dc0aa78b770fa6a738034120c302
- **SAND (The Sandbox Token)**: 0x8c7d5313253ad9cb655bbb62f7ac2d7f014fcb8f
- **TWT (Trust Wallet Token)**: 0x4b0f1812e2e12d3c44e8fa1f139e7a5dca17a8a1
- **FEG (FEG Token)**: 0x7f0c41d2f529f7f13c7ac3b0f1be6a71139cb908
- **DOGE (Dogecoin on BSC)**: 0xbb4cd3b9b36b01bdbb9c1cbbf2de08d9173b2b1f7
- **SHIB (Shiba Inu)**: 0x95a8f1f22105f21d382ae20c6da2b60c7b4be54b
- **MBOX (Mobox)**: 0x3203c4f9bb64e5c8975d56a55175c76e2c2c7457
- **TLM (Alien Worlds)**: 0x2697b90d7226e9284eaddc69b73429b382fefecf
- **GMT (Green Metaverse Token)**: 0x6e2a3e27c3a3b9c02f05c2cba19c2b0f3879ef0a
- **HGET (Hegic Token)**: 0x35a73e905f1e8fa5e88c1f20525f0de2fba3d8d2
- **LINA (Linear Finance)**: 0x0c02835e1fd60fcae75e5985cf255fc30d40b4f3
- **CHZ (Chiliz)**: 0x7a8f9a5e99ac537093dc9f6072f9fe4a83edb35f
- **LEO (Bitfinex LEO Token)**: 0x5f2d46d0130b9da14abfe19e1ec938fb7f9b74b3
- **BIFI (Beefy Finance)**: 0x5d72df7e7f3d60c14bfe8c94cfe2c39d9d5fd593
- **YFI (Yearn Finance)**: 0x3e7d1cbb73f7e9e7b8245db56c1a6f7a469be2e4
- **FTM (Fantom Token on BSC)**: 0x4e15361fd6b4bb609fa63c81a2f43f3d2d7fa888
- **USDC**: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
- **USDT**: 0x55d398326f99059fF775485246999027B3197955
- **DIA**: 0x29c1faef70b1d41848b5f25ea7e75a16866fd4eb

## Dependencies
- `ethers`: For interacting with the Ethereum network.
- `node-fetch`: For making HTTP requests (if needed).

## License
This project is licensed under the MIT License.
