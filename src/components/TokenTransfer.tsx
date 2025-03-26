import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract, useSwitchChain, useReadContract, useBalance, useWaitForTransactionReceipt, useSimulateContract, useSendTransaction } from 'wagmi';
import { parseEther, parseUnits, formatUnits } from 'viem';
import { chainOptions, erc20ABI, getErrorMessage, validateAddress, validateAmount } from '../config';
import { Wallet, Send, Coins, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

type TokenType = 'native' | 'erc20';

type TransactionStatus = {
  type: 'error' | 'success' | 'info' | null;
  message: string;
};

function TokenTransfer() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const {  sendTransaction ,  data: hash, isPending} = useSendTransaction();
  const { 
    data: hash1,
    writeContract,
    isPending : isPending1,
  } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState(chainOptions[0]);
  const [tokenType, setTokenType] = useState<TokenType>('native');
  const [tokenAddress, setTokenAddress] = useState('');
  const [status, setStatus] = useState<TransactionStatus>({ type: null, message: '' });
  const [isValidating, setIsValidating] = useState(false);

  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address,
  });

  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: isConnected && tokenType === 'erc20' && validateAddress(tokenAddress),
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20ABI,
    functionName: 'decimals',
    enabled: tokenType === 'erc20' && validateAddress(tokenAddress),
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20ABI,
    functionName: 'symbol',
    enabled: tokenType === 'erc20' && validateAddress(tokenAddress),
  });

  // Simulate the contract call to check for potential errors
  const { data: simulateData } = useSimulateContract({
    address: tokenType === 'erc20' ? tokenAddress as `0x${string}` : undefined,
    abi: tokenType === 'erc20' ? erc20ABI : undefined,
    functionName: 'transfer',
    args: tokenType === 'erc20' ? [recipient as `0x${string}`, parseUnits(amount || '0', decimals || 18)] : undefined,
    value: tokenType === 'native' ? parseEther(amount || '0') : undefined,
    enabled: isConnected && validateAddress(recipient) && validateAmount(amount),
  });

  useEffect(() => {
    if (isSuccess) {
      setStatus({ 
        type: 'success', 
        message: 'Transaction completed successfully! Your transfer has been confirmed on the blockchain.' 
      });
      setAmount('');
      setRecipient('');
      if (tokenType === 'erc20') {
        setTokenAddress('');
      }
      refetchNativeBalance();
      if (tokenType === 'erc20') {
        refetchTokenBalance();
      }
    }
  }, [isSuccess]);

  const validateInput = async () => {
    setIsValidating(true);
    try {
      if (!validateAddress(recipient)) {
        setStatus({ type: 'error', message: 'Invalid recipient address format' });
        return false;
      }

      if (!validateAmount(amount)) {
        setStatus({ type: 'error', message: 'Please enter a valid amount' });
        return false;
      }

      if (tokenType === 'erc20' && !validateAddress(tokenAddress)) {
        setStatus({ type: 'error', message: 'Invalid token contract address' });
        return false;
      }

      if (tokenType === 'native' && nativeBalance) {
        const transferAmount = parseEther(amount);
        if (transferAmount > nativeBalance.value) {
          setStatus({ type: 'error', message: 'Insufficient native token balance' });
          return false;
        }
      } else if (tokenType === 'erc20' && tokenBalance && decimals) {
        const transferAmount = parseUnits(amount, decimals);
        if (transferAmount > tokenBalance) {
          setStatus({ type: 'error', message: 'Insufficient token balance' });
          return false;
        }
      }

      return true;
    } finally {
      setIsValidating(false);
    }
  };

  const handleConnect = async () => {
    try {
      setStatus({ type: 'info', message: 'Connecting wallet...' });
      await connect({ connector: connectors[0] });
      setStatus({ type: 'success', message: 'Wallet connected successfully' });
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) });
    }
  };

  const handleChainChange = async (chainId: number) => {
    const newChain = chainOptions.find(chain => chain.id === chainId) || chainOptions[0];
    setSelectedChain(newChain);
    
    try {
      setStatus({ type: 'info', message: 'Switching network...' });
      await switchChain({ chainId });
      setStatus({ type: 'success', message: `Switched to ${newChain.name} network` });
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) });
    }
  };

  const handleTransfer = async () => {
    if (!await validateInput()) return;

    try {
      setStatus({ type: 'info', message: 'Preparing transaction...' });

      // if (!simulateData?.request) {
      //   throw new Error('Failed to simulate transaction');
      // }

      console.log('simulateData', simulateData)
      if (tokenType != 'erc20') {
        await sendTransaction({
          // ...simulateData.request,
          to: recipient as `0x${string}`,
          value: parseEther(amount),
        })
      } else {
        await writeContract({
          // ...simulateData.request,
          address: tokenAddress as `0x${string}`,
          abi: erc20ABI,
          functionName: 'transfer',
          args: [recipient as `0x${string}`, parseUnits(amount, decimals || 18)],
        });
      }

      setStatus({ type: 'info', message: 'Transaction submitted. Waiting for confirmation...' });
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) });
    }
  };

  const handleRefreshBalance = async () => {
    try {
      setStatus({ type: 'info', message: 'Refreshing balances...' });
      await refetchNativeBalance();
      if (tokenType === 'erc20') {
        await refetchTokenBalance();
      }
      setStatus({ type: 'success', message: 'Balances updated successfully' });
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) });
    }
  };

  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return '0';
    return formatUnits(balance, decimals);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      {status.type && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          status.type === 'error' ? 'bg-red-100 text-red-700' :
          status.type === 'success' ? 'bg-green-100 text-green-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {status.type === 'error' && <AlertCircle size={16} />}
          {status.type === 'success' && <CheckCircle2 size={16} />}
          {status.type === 'info' && <AlertCircle size={16} />}
          <span className="text-sm">{status.message}</span>
        </div>
      )}

      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Wallet size={20} />
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
            <button
              onClick={() => disconnect()}
              className="text-red-600 text-sm hover:text-red-700"
            >
              Disconnect
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Select Chain</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedChain.id}
              onChange={(e) => handleChainChange(Number(e.target.value))}
            >
              {chainOptions.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name} ({chain.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Token Type</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={tokenType}
              onChange={(e) => {
                setTokenType(e.target.value as TokenType);
                setTokenAddress('');
                setAmount('');
              }}
            >
              <option value="native">Native Token ({selectedChain.symbol})</option>
              <option value="erc20">ERC20 Token</option>
            </select>
          </div>

          {tokenType === 'erc20' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Token Contract Address</label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0x..."
              />
            </div>
          )}

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Balance: </span>
                <span className="text-sm text-gray-600">
                  {tokenType === 'native' 
                    ? `${nativeBalance?.formatted || '0'} ${selectedChain.symbol}`
                    : `${formatBalance(tokenBalance, decimals || 18)} ${symbol || 'Token'}`
                  }
                </span>
              </div>
              <button
                onClick={handleRefreshBalance}
                className="text-blue-600 hover:text-blue-700"
                title="Refresh Balance"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                recipient && !validateAddress(recipient)
                  ? 'border-red-300'
                  : 'border-gray-300'
              }`}
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                amount && !validateAmount(amount)
                  ? 'border-red-300'
                  : 'border-gray-300'
              }`}
              placeholder="0.0"
              step="0.000000000000000001"
              min="0"
            />
          </div>

          <button
            onClick={handleTransfer}
            disabled={isPending || isConfirming || isValidating}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {(isPending || isConfirming || isValidating) ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
            {isValidating ? 'Validating...' : 
              isPending ? 'Confirming...' : 
              isConfirming ? 'Processing...' : 
              'Transfer'}
          </button>
        </div>
      )}
    </div>
  );
}

export default TokenTransfer;