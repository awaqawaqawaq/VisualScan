import React from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';

const ConnectWalletButton: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    const displayName = ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`;
    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-white truncate max-w-[120px]">{displayName}</p>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-gray-700 text-sm text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600/50 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }
  
  const injectedConnector = connectors.find(c => c.type === 'injected');

  return (
    <button
      disabled={isPending || !injectedConnector}
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      className="bg-blue-600 text-sm text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};

export default ConnectWalletButton;
