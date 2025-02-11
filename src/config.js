const config = {
  API_KEY: "m_zqgElJG_pdR_FJchhyqAJ20yVB-DrB",
  API_URL:
    "https://bnb-mainnet.g.alchemy.com/v2/m_zqgElJG_pdR_FJchhyqAJ20yVB-DrB", // Mainnet URL
  TESTNET_URL:
    "https://bnb-testnet.g.alchemy.com/v2/m_zqgElJG_pdR_FJchhyqAJ20yVB-DrB", // Testnet URL
  WS_MAINNET:
    "wss://bnb-mainnet.g.alchemy.com/v2/m_zqgElJG_pdR_FJchhyqAJ20yVB-DrB", // WebSocket Mainnet
  WS_TESTNET:
    "wss://bnb-testnet.g.alchemy.com/v2/m_zqgElJG_pdR_FJchhyqAJ20yVB-DrB", // WebSocket Testnet
  APP_ID: "0nur39ettwmld9rs"
};

// DEX Router Addresses with Additional Metadata
const DEX_ROUTERS = {
  PancakeSwapV3: {
    address: "0x5c69bEe701ef814a2B6a3EDD96bA8C7c27f4bA85",
    chain: "BSC",
    volume_24h: 1500000000,
    liquidity: 2000000000,
    websocket: {
      endpoint: "wss://stream.binance.com:9443/ws/pancakeswap",
      heartbeat_interval_ms: 30000,
      reconnect_timeout_ms: 5000,
      max_reconnect_attempts: 10
    }
  },
  PancakeSwapV2: {
    address: "0x05fF8d2126E0063F96Dd4C3f7F27a7A72eC8d6aD",
    chain: "BSC",
    volume_24h: 1200000000,
    liquidity: 1800000000
  },
  THENAFusion: {
    address: "0x9c1e39313a3cd995462b70d1572e68fdd864404e",
    chain: "BSC",
    volume_24h: 600000000,
    liquidity: 900000000,
    websocket: {
      endpoint: "wss://thena-stream.binance.com/ws",
      heartbeat_interval_ms: 35000,
      reconnect_timeout_ms: 5500,
      max_reconnect_attempts: 8
    }
  },
  DODORouter: {
    address: "0x8eae292e44c5cfa3b3980f60e33eddd5d303951c",
    chain: "BSC",
    volume_24h: 1000000000,
    liquidity: 1500000000
  },
  PancakeSwapStableswap: {
    address: "0x0e37a0758a1c47b2d3fe5c6431464574f2f3b9dd",
    chain: "BSC",
    volume_24h: 800000000,
    liquidity: 1200000000
  },
  UnchainXRouter: {
    address: "0x0b0d8e36bca0e207be33ff270a1397a61f9981cc",
    chain: "BSC",
    volume_24h: 500000000,
    liquidity: 800000000
  },
  NomiswapRouter: {
    address: "0x73db91e2ae9a0439f5d3bc0ec402f7d4e98b88f7",
    chain: "BSC",
    volume_24h: 400000000,
    liquidity: 600000000
  },
  PancakeSwapV1: {
    address: "0x5c69bEe701ef814a2B6a3EDD96bA8C7c27f4bA85",
    chain: "BSC",
    volume_24h: 300000000,
    liquidity: 500000000
  },
  BiswapV3Router: {
    address: "0x04f3edc3bb42b4e7e9d8ffb05d50730ab8f3d82b",
    chain: "BSC",
    volume_24h: 200000000,
    liquidity: 400000000
  },
  BiswapRouter: {
    address: "0x16e209f2c7c34a78ac960d0aaf334da8be8468d3",
    chain: "BSC",
    volume_24h: 150000000,
    liquidity: 300000000
  },
  THENA: {
    address: "0x86bcd3b21bbab4ab19bcbb719cc8e0208c8d50a2",
    chain: "BSC",
    volume_24h: 800000000,
    liquidity: 1200000000
  },
  ApeswapRouter: {
    address: "0x95a30c30297a8245e497a1060c5f72ec0729c9b8",
    chain: "BSC",
    volume_24h: 500000000,
    liquidity: 800000000
  },
  BabyswapRouter: {
    address: "0x3c5fdd42fa8d2f60ef829b52987d56419e30db74",
    chain: "BSC",
    volume_24h: 400000000,
    liquidity: 600000000
  },
  BakerySwapRouter: {
    address: "0x3c6e1d9c6585f68b717c75c99f7a44145d2c422d",
    chain: "BSC",
    volume_24h: 300000000,
    liquidity: 500000000
  },
  BabydodgeSwapRouter: {
    address: "0x6d06f8b436ddcc01f98ad3434915f08316948f7a",
    chain: "BSC",
    volume_24h: 200000000,
    liquidity: 400000000
  },
  SquadSwapV2Router: {
    address: "0x6d8b24bb5e2cce6b03b6f30cd7f3c1e03043f4fa",
    chain: "BSC",
    volume_24h: 150000000,
    liquidity: 300000000
  },
  WombatExchangeRouter: {
    address: "0x24014b4bb2a9a33c345897abb446c144c5e42376",
    chain: "BSC",
    volume_24h: 100000000,
    liquidity: 200000000
  }
};

// Trading Pairs with Additional Metadata
const TRADING_PAIRS = {
  BNB: {
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173b2b1f7",
    volume_24h: 400000000,
    liquidity: 550000000
  },
  CAKE: {
    address: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
    volume_24h: 300000000,
    liquidity: 450000000
  },
  XVS: {
    address: "0x1e1e7e6f7d93cc67ffed9f842c7f35e18a92a70b",
    volume_24h: 200000000,
    liquidity: 350000000
  },
  BAKE: {
    address: "0x6d1c3e17ed9920fd04c15c5c411d4692b0dfda3d",
    volume_24h: 150000000,
    liquidity: 300000000
  },
  BURGER: {
    address: "0x7130d2a12b9b241f502d7cbc10b04224e9b365f2",
    volume_24h: 100000000,
    liquidity: 200000000
  },
  AUTO: {
    address: "0xB1b5fd4A3e13E3F4AC0Dbb340e72eD18B157c5E7",
    volume_24h: 80000000,
    liquidity: 150000000
  },
  SUSHI: {
    address: "0x47a6e1646a90465c02bb62a2e67399b795e4b159",
    volume_24h: 60000000,
    liquidity: 120000000
  },
  UNI: {
    address: "0xb5c7b5a2dd21f7790f6d4a9c9b24dbf89e33a01b",
    volume_24h: 50000000,
    liquidity: 100000000
  },
  "1INCH": {
    address: "0x111111111117dc0aa78b770fa6a738034120c302",
    volume_24h: 40000000,
    liquidity: 90000000
  },
  SAND: {
    address: "0x8c7d5313253ad9cb655bbb62f7ac2d7f014fcb8f",
    volume_24h: 30000000,
    liquidity: 80000000
  },
  TWT: {
    address: "0x4b0f1812e2e12d3c44e8fa1f139e7a5dca17a8a1",
    volume_24h: 20000000,
    liquidity: 70000000
  },
  FEG: {
    address: "0x7f0c41d2f529f7f13c7ac3b0f1be6a71139cb908",
    volume_24h: 15000000,
    liquidity: 60000000
  },
  DOGE: {
    address: "0xbb4cd3b9b36b01bdbb9c1cbbf2de08d9173b2b1f7",
    volume_24h: 10000000,
    liquidity: 50000000
  },
  SHIB: {
    address: "0x95a8f1f22105f21d382ae20c6da2b60c7b4be54b",
    volume_24h: 8000000,
    liquidity: 40000000
  },
  MBOX: {
    address: "0x3203c4f9bb64e5c8975d56a55175c76e2c2c7457",
    volume_24h: 6000000,
    liquidity: 35000000
  },
  TLM: {
    address: "0x2697b90d7226e9284eaddc69b73429b382fefecf",
    volume_24h: 5000000,
    liquidity: 30000000
  },
  GMT: {
    address: "0x6e2a3e27c3a3b9c02f05c2cba19c2b0f3879ef0a",
    volume_24h: 4000000,
    liquidity: 25000000
  },
  HGET: {
    address: "0x35a73e905f1e8fa5e88c1f20525f0de2fba3d8d2",
    volume_24h: 3000000,
    liquidity: 20000000
  },
  LINA: {
    address: "0x0c02835e1fd60fcae75e5985cf255fc30d40b4f3",
    volume_24h: 2000000,
    liquidity: 15000000
  },
  CHZ: {
    address: "0x7a8f9a5e99ac537093dc9f6072f9fe4a83edb35f",
    volume_24h: 1500000,
    liquidity: 10000000
  },
  LEO: {
    address: "0x5f2d46d0130b9da14abfe19e1ec938fb7f9b74b3",
    volume_24h: 1000000,
    liquidity: 8000000
  },
  BIFI: {
    address: "0x5d72df7e7f3d60c14bfe8c94cfe2c39d9d5fd593",
    volume_24h: 800000,
    liquidity: 6000000
  },
  YFI: {
    address: "0x3e7d1cbb73f7e9e7b8245db56c1a6f7a469be2e4",
    volume_24h: 600000,
    liquidity: 5000000
  },
  FTM: {
    address: "0x4e15361fd6b4bb609fa63c81a2f43f3d2d7fa888",
    volume_24h: 500000,
    liquidity: 4000000
  },
  USDC: {
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    volume_24h: 400000,
    liquidity: 3500000
  },
  USDT: {
    address: "0x55d398326f99059fF775485246999027B3197955",
    volume_24h: 300000,
    liquidity: 3000000
  },
  DIA: {
    address: "0x29c1faef70b1d41848b5f25ea7e75a16866fd4eb",
    volume_24h: 200000,
    liquidity: 2500000
  }
};

// Arbitrage Configuration
const ARBITRAGE_CONFIG = {
  // DEX and Token Synchronization Settings
  SYNCHRONIZATION: {
    // Maximum time allowed between first and last data point (in milliseconds)
    MAX_DATA_SYNC_WINDOW: 500, // 500ms to ensure near-simultaneous data capture
    
    // Minimum number of DEXs that must report data for analysis
    MIN_DEX_PARTICIPATION: 3,
    
    // Rolling data storage configuration
    ROLLING_WINDOW: {
      SIZE: 5, // Keep last 5 price points
      OVERWRITE_MODE: 'circular' // Circular buffer for price tracking
    }
  },
  
  // Profit Threshold and Filtering
  PROFIT_ANALYSIS: {
    // Minimum profit percentage to consider an arbitrage opportunity
    MIN_PROFIT_THRESHOLD: 2.5, // 2.5% minimum profit
    
    // Absolute price difference threshold
    MIN_ABSOLUTE_PRICE_DIFFERENCE: 0.10, // $0.10 minimum difference
    
    // Maximum allowed price volatility during analysis window
    MAX_PRICE_VOLATILITY: 0.05, // 5% max volatility
    
    // Execution time constraints
    EXECUTION_CONSTRAINTS: {
      // Maximum time from data capture to transaction execution
      MAX_EXECUTION_WINDOW: 250, // 250ms from data to execution
      
      // Minimum time between arbitrage attempts for same token pair
      MIN_REPEAT_INTERVAL: 60000 // 1 minute between attempts
    }
  },
  
  // Flash Loan Configuration
  FLASH_LOAN: {
    BASE_PERCENTAGE: 0.45, // 45% of available liquidity
    
    // Dynamic adjustment based on opportunity size
    DYNAMIC_PERCENTAGE_RANGE: {
      MIN: 0.35, // Minimum 35%
      MAX: 0.55  // Maximum 55%
    }
  },
  
  // Logging and Monitoring
  MONITORING: {
    // Log all potential opportunities, even if not executed
    LOG_ALL_OPPORTUNITIES: true,
    
    // Detailed logging level
    LOG_LEVEL: 'debug'
  },
  
  // Profit Destination
  PROFIT_DESTINATION_WALLET: "0x0BC94971061Ceb923F23ED866b8067c2e0721ef9",
  
  // DEX and Token Scanning Limits
  MAX_DEX_SCAN: 50,
  MAX_PAIR_SCAN: 1000
};

module.exports = { 
  config, 
  DEX_ROUTERS, 
  TRADING_PAIRS,
  ARBITRAGE_CONFIG 
};
