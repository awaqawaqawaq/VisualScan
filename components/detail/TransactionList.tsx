

import React, { useState } from 'react';
import { ArkhamTransfer } from '../../types';
import { ExternalLinkIcon } from '../icons';

interface TransactionListProps {
  baseAddress: string;
  transfers: ArkhamTransfer[];
  total: number;
  offset: number;
  pageSize: number;
  onPageChange: (newOffset: number) => void;
  isLoading: boolean;
  error: string | null;
}

const getExplorerLink = (chain: string, txHash: string) => {
    switch (chain.toLowerCase()) {
        case 'solana':
            return `https://solscan.io/tx/${txHash}`;
        case 'bsc':
            return `https://bscscan.com/tx/${txHash}`;
        case 'polygon':
            return `https://polygonscan.com/tx/${txHash}`;
        case 'arbitrum':
            return `https://arbiscan.io/tx/${txHash}`;
        case 'optimism':
            return `https://optimistic.etherscan.io/tx/${txHash}`;
        case 'avalanche':
            return `https://snowtrace.io/tx/${txHash}`;
        case 'ethereum':
        default:
            return `https://etherscan.io/tx/${txHash}`;
    }
}

const TransactionRow: React.FC<{ tx: ArkhamTransfer, isOut: boolean }> = ({ tx, isOut }) => {
    const counterparty = isOut ? tx.toAddress : tx.fromAddress;
    const counterpartyLabel = counterparty.arkhamEntity?.name || counterparty.arkhamLabel?.name || `${counterparty.address.substring(0, 6)}...${counterparty.address.substring(counterparty.address.length - 4)}`;
    const [copiedToken, setCopiedToken] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);

    const handleCopyTokenAddress = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (tx.tokenAddress) {
            navigator.clipboard.writeText(tx.tokenAddress);
            setCopiedToken(true);
            setTimeout(() => setCopiedToken(false), 2000);
        }
    };

    const handleCopyAddress = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(counterparty.address);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
    };

    return (
        <tr className="hover:bg-gray-800/50 transition-colors duration-150">
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isOut ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                    {isOut ? 'OUT' : 'IN'}
                </span>
            </td>
            <td className="py-4 px-3 text-sm">
                <div className="relative group">
                    <button onClick={handleCopyAddress} className="text-left w-full">
                        <div className="font-medium text-white">{counterpartyLabel}</div>
                        <div className="text-gray-400 font-mono">{counterparty.address}</div>
                    </button>
                    {copiedAddress && <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">Copied!</span>}
                    <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs bg-gray-600 text-white text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ring-1 ring-gray-500 z-20">
                      Click to copy address
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-600"></div>
                    </div>
                </div>
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 font-mono">
                {tx.historicalUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                 <div className="relative group">
                    <button onClick={handleCopyTokenAddress} className="text-left disabled:cursor-default" disabled={!tx.tokenAddress}>
                        <div className="font-medium text-white">{tx.tokenName || 'N/A'}</div>
                        <div className="text-gray-400">{tx.tokenSymbol || 'N/A'}</div>
                    </button>
                    {copiedToken && <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">Copied!</span>}
                    {tx.tokenAddress && (
                        <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs bg-gray-600 text-white text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ring-1 ring-gray-500 z-20">
                          {tx.tokenAddress}
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-600"></div>
                        </div>
                    )}
                </div>
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                {new Date(tx.blockTimestamp).toLocaleString()}
            </td>
            <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <a href={getExplorerLink(tx.chain, tx.transactionHash)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    <ExternalLinkIcon className="w-5 h-5"/>
                </a>
            </td>
        </tr>
    );
};

const PaginationControls: React.FC<{ offset: number; total: number; onPageChange: (newOffset: number) => void; pageSize: number; }> = ({ offset, total, onPageChange, pageSize }) => {
    const totalPages = Math.ceil(total / pageSize);
    const currentPage = Math.floor(offset / pageSize) + 1;

    return (
        <div className="flex items-center justify-between border-t border-gray-700 px-4 py-3 sm:px-6">
            <div>
                <p className="text-sm text-gray-400">
                    Showing <span className="font-medium">{offset + 1}</span> to <span className="font-medium">{Math.min(offset + pageSize, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> results
                </p>
            </div>
            <div className="flex items-center gap-2">
                 <span className="text-sm text-gray-400">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </span>
                <div className="flex gap-2 ml-4">
                    <button
                        onClick={() => onPageChange(offset - pageSize)}
                        disabled={offset === 0}
                        className="rounded-md bg-gray-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => onPageChange(offset + pageSize)}
                        disabled={offset + pageSize >= total}
                        className="rounded-md bg-gray-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};


const TransactionList: React.FC<TransactionListProps> = ({ 
    baseAddress,
    transfers,
    total,
    offset,
    pageSize,
    onPageChange,
    isLoading,
    error
}) => {
    if (isLoading) {
        return (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg ring-1 ring-gray-700">
                <h3 className="text-lg font-semibold text-white">Loading Transactions...</h3>
                <p className="mt-1 text-sm text-gray-400">Fetching recent activity from Arkham Intelligence.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 bg-red-900/30 rounded-lg ring-1 ring-red-700">
                <h3 className="text-lg font-semibold text-white">Error Loading Transactions</h3>
                <p className="mt-1 text-sm text-red-300">{error}</p>
                <p className="mt-2 text-xs text-gray-400">This may be due to a network issue or a CORS policy from the Arkham API.</p>
            </div>
        );
    }
    
    if (total === 0) {
        return (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg ring-1 ring-gray-700">
                <h3 className="text-lg font-semibold text-white">No Transactions Found</h3>
                <p className="mt-1 text-sm text-gray-400">Could not retrieve any transaction data from Arkham API for this address.</p>
            </div>
        );
    }
    
    const lowerBaseAddress = baseAddress.toLowerCase();

    return (
        <div className="bg-gray-800/50 rounded-lg ring-1 ring-gray-700 overflow-hidden">
            <div className="px-4 sm:px-6 py-4">
                 <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                 <p className="text-sm text-gray-400 mt-1">Showing the last {transfers.length} of {total} transactions, powered by Arkham Intelligence.</p>
            </div>
            <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Type</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Counterparty</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Value (USD)</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Token</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Date</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                        <span className="sr-only">View</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {transfers.map((tx) => (
                                    <TransactionRow key={tx.id} tx={tx} isOut={tx.fromAddress.address.toLowerCase() === lowerBaseAddress} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
             <PaginationControls 
                offset={offset}
                total={total}
                onPageChange={onPageChange}
                pageSize={pageSize}
            />
        </div>
    );
};

export default TransactionList;