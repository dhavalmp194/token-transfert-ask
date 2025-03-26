import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config';
import TokenTransfer from './components/TokenTransfer';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-100">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center mb-8">Token Transfer</h1>
            <TokenTransfer />
          </div>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;