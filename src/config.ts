import { createConfig } from "wagmi";
import { http } from "viem";
import { sepolia, polygonAmoy, bscTestnet } from "viem/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [sepolia, polygonAmoy, bscTestnet],
  transports: {
    [sepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [bscTestnet.id]: http(),
  },
  connectors: [injected()],
});

export const chainOptions = [
  { id: sepolia.id, name: "Sepolia", symbol: "ETH" },
  { id: polygonAmoy.id, name: "Amoy", symbol: "MATIC" },
  { id: bscTestnet.id, name: "BSC Testnet", symbol: "tBNB" },
];

export const erc20ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
] as const;

export const getErrorMessage = (error: any): string => {
  if (typeof error === "string") return error;

  if (error?.code) {
    switch (error.code) {
      case 4001:
        return "Transaction rejected by user";
      case -32603:
        return "Internal JSON-RPC error. Please check your wallet has sufficient funds.";
      case "INSUFFICIENT_FUNDS":
        return "Insufficient funds for transfer";
      case "UNPREDICTABLE_GAS_LIMIT":
        return "Unable to estimate gas. The transaction may fail.";
      case "USER_REJECTED":
        return "Transaction was rejected by the user";
      case "NETWORK_ERROR":
        return "Network error. Please check your connection and try again.";
      case "CHAIN_MISMATCH":
        return "Please switch to the correct network in your wallet";
      case "CONTRACT_ERROR":
        return "Smart contract error. The transaction cannot be completed.";
      case -32002:
        return "MetaMask is already processing a request. Please check your MetaMask wallet.";
    }
  }

  if (error?.message) {
    if (error.message.includes("insufficient funds")) {
      return "Insufficient funds for transfer";
    }
    if (error.message.includes("gas required exceeds allowance")) {
      return "Transaction would exceed gas limit";
    }
    if (error.message.includes("nonce too low")) {
      return "Transaction nonce error. Please try again.";
    }
    if (error.message.includes("replacement fee too low")) {
      return "Gas price too low. Please increase gas price and try again.";
    }
    if (error.message.includes("MetaMask")) {
      return "Please check MetaMask and try again";
    }
    return error.message;
  }

  return "An unknown error occurred";
};

export const validateAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const validateAmount = (amount: string): boolean => {
  const number = parseFloat(amount);
  return !isNaN(number) && number > 0;
};
