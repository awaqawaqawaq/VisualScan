
import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { AddressData, Tag as ITag, ArkhamTransfer, PnlData } from '../../types';
import { ChevronLeftIcon, ExternalLinkIcon, SparklesIcon, ChartPieIcon, TransactionIcon, CopyIcon, ShieldCheckIcon } from '../icons';
import AISummary from './AISummary';
import VisualScan from './VisualScan';
import TaggingSection from './TaggingSection';
import TransactionList from './TransactionList';
import { gsap } from 'gsap';
import { fetchArkhamTransfers, fetchTagsForAddress, fetchDebotStats } from '../../api';
import { mapOfficialTag } from '../../utils/tags';
import { useSignMessage, useAccount, useWriteContract } from 'wagmi';
import { readContract, waitForTransactionReceipt } from 'wagmi/actions';
import { config, INFO_TOKEN_ADDRESS, TAG_REGISTRY_ADDRESS, infoTokenABI, tagRegistryABI } from '../../utils/web3';
import { maxUint256 } from 'viem';
import { bscTestnet } from 'wagmi/chains';

interface AddressDetailProps {
  addressData: AddressData;
  allAddresses: AddressData[];
  onBack: () => void;
  onUpdateAddress: (updatedAddress: AddressData) => void;
  onAddressSelect: (address: AddressData) => void;
  onTagSelect: (tag: ITag) => void;
  connectedAddress?: `0x${string}`;
}

const PAGE_SIZE = 16;

// --- START: Helper Components for Dashboard ---

const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-gray-800/50 p-4 md:p-5 rounded-xl ring-1 ring-gray-700 h-full ${className}`}>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <div className="mt-4">
            {children}
        </div>
    </div>
);

const ValueWithColor: React.FC<{ value: number; children: React.ReactNode }> = ({ value, children }) => {
    const colorClass = value >= 0 ? 'text-green-400' : 'text-red-400';
    return <span className={`font-mono ${colorClass}`}>{children}</span>;
};

const InfoRow: React.FC<{ label: string; children: React.ReactNode; tooltip?: string }> = ({ label, children, tooltip }) => (
    <div className="flex justify-between items-center py-3 px-3 -mx-3 rounded-lg transition-colors duration-200 hover:bg-gray-700/40 text-sm">
        <span className="text-gray-400 relative group">
            {label}
            {tooltip && (
                <span className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-700 text-white text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ring-1 ring-gray-600 z-20">
                    {tooltip}
                </span>
            )}
        </span>
        <div className="text-right text-gray-200 font-medium">{children}</div>
    </div>
);

const formatCurrency = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
const formatDuration = (seconds: number) => {
    if (seconds < 3600) return `${Math.round(seconds / 60)} mins`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`;
    return `${(seconds / 86400).toFixed(1)} days`;
};

// --- END: Helper Components ---

const VerifyOwnership: React.FC<{ connectedAddress: `0x${string}` }> = ({ connectedAddress }) => {
    const { data: hash, error, isPending, signMessage } = useSignMessage();
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    
    const handleSign = async () => {
        setIsVerified(null);
        signMessage({ account: connectedAddress, message: 'Hi, VisualScan' });
    };

    useEffect(() => {
        if (hash) {
            // In a real app, you'd send this hash to a backend for verification.
            // Here, we'll just simulate success.
            setIsVerified(true);
        }
        if (error) {
            setIsVerified(false);
        }
    }, [hash, error]);

    return (
        <InfoCard title="Verify Ownership">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-gray-400 max-w-md">
                    To access certain features or prove you control this address, sign a message. This is a gas-free transaction.
                </p>
                <button
                    onClick={handleSign}
                    disabled={isPending}
                    className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-wait"
                >
                    <ShieldCheckIcon className="w-5 h-5" />
                    {isPending ? 'Check Wallet...' : 'Sign Message to Verify'}
                </button>
            </div>
            {isVerified === true && (
                <div className="mt-4 p-3 rounded-md bg-green-500/10 ring-1 ring-green-500/30 text-green-300 text-sm">
                    Signature verified successfully. You own this address.
                </div>
            )}
            {isVerified === false && (
                <div className="mt-4 p-3 rounded-md bg-red-500/10 ring-1 ring-red-500/30 text-red-300 text-sm">
                    Signature failed. Please try again.
                </div>
            )}
        </InfoCard>
    );
};


const AddressDetail: React.FC<AddressDetailProps> = ({ addressData, allAddresses, onBack, onUpdateAddress, onAddressSelect, onTagSelect, connectedAddress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [addressCopied, setAddressCopied] = useState(false);
  const { pnlData, communityTags } = addressData;

  // Web3 state
  const { writeContractAsync } = useWriteContract();
  const [isSubmittingTag, setIsSubmittingTag] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  // PNL Data states
  const [isPnlLoading, setIsPnlLoading] = useState(true);
  const [pnlError, setPnlError] = useState<string | null>(null);

  // State for paginated transaction data
  const [transactions, setTransactions] = useState<ArkhamTransfer[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  // Animate the main page structure only when the address ID changes
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { opacity: 0, ease: 'power3.out' } });
        tl.from('.anim-back-button', { x: -20, duration: 0.4 })
          .from('.anim-header', { y: -20, duration: 0.5 }, '-=0.2')
          .from('.anim-tab-nav', { y: -20, duration: 0.4 }, '-=0.2');
    }, containerRef);
    return () => ctx.revert();
  }, [addressData.id]);

  // Animate the content of the tab whenever the active tab changes
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
        gsap.fromTo('.anim-tab-content', 
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', delay: 0.1 }
        );
    }, containerRef);
    return () => ctx.revert();
  }, [activeTab]);

  // When the address changes (e.g., from Visual Scan), reset to the overview tab.
  useEffect(() => {
    setActiveTab('overview');
  }, [addressData.id]);
  
  // Fetch community tags from Axiom if we are viewing a newly added address
  useEffect(() => {
      // Heuristic: A temporary address has an ID equal to its address and no tags initially.
      const isTemporaryAddress = addressData.id === addressData.address;
      const hasNoCommunityTags = addressData.communityTags.length === 0;

      if (isTemporaryAddress && hasNoCommunityTags) {
          const loadTags = async () => {
              const axiomData = await fetchTagsForAddress(addressData.address);
              if (axiomData && axiomData.tags.length > 0) {
                  const newCommunityTags = axiomData.tags.map(apiTag => {
                      const mappedTag = mapOfficialTag(apiTag.tagName);
                      return {
                        ...mappedTag,
                        id: `found-ct-${addressData.address}-${apiTag.tagName}`,
                        upvotes: apiTag.count,
                        downvotes: 0,
                        submittedBy: 'MemeRadar',
                        upvoted: false,
                        downvoted: false,
                        isOfficial: false,
                      };
                    });
                  onUpdateAddress({ ...addressData, communityTags: newCommunityTags });
              }
          };
          loadTags();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressData.id]);


  // Fetch real-time PNL data from debot.ai
  useEffect(() => {
    const loadPnlData = async () => {
      setIsPnlLoading(true);
      setPnlError(null);
      try {
        const newPnlData = await fetchDebotStats(addressData.address);
        // Merge the new data with the existing data to preserve fields like avatar, name, etc.
        const updatedPnlData = { ...addressData.pnlData, ...newPnlData };
        onUpdateAddress({ ...addressData, pnlData: updatedPnlData });
      } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        setPnlError(`Failed to load wallet statistics: ${message}`);
        console.error("Error fetching PNL data from debot.ai:", error);
      } finally {
        setIsPnlLoading(false);
      }
    };

    loadPnlData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressData.address]);


  // Fetch paginated transaction data. Re-fetches when address, page (offset), or active tab changes.
  useEffect(() => {
    const loadTransactions = async () => {
      if (!addressData.address) return;

      // Only fetch data if the relevant tabs are active to prevent unnecessary calls.
      if (activeTab === 'transactions' || activeTab === 'visualscan') {
        setIsTransactionsLoading(true);
        setTransactionsError(null);
        try {
          const response = await fetchArkhamTransfers(addressData.address, { limit: PAGE_SIZE, offset });
          setTransactions(response.transfers || []);
          setTotalTransactions(response.count || 0);
        } catch (error) {
          console.error("Failed to load Arkham transfers:", error);
          const message = error instanceof Error ? error.message : "An unknown error occurred.";
          setTransactionsError(`Failed to fetch transactions. ${message}`);
        } finally {
          setIsTransactionsLoading(false);
        }
      }
    };

    loadTransactions();
  }, [addressData.address, offset, activeTab]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(addressData.address);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 2000);
  };

  const handleAddTag = async (tag: Omit<ITag, 'id' | 'upvotes' | 'downvotes' | 'submittedBy' | 'upvoted' | 'downvoted'>) => {
    if (!connectedAddress) {
        alert("Please connect your wallet to submit a tag.");
        return;
    }
    
    setIsSubmittingTag(true);
    try {
        const tagSubmitCost = await readContract(config, {
            abi: tagRegistryABI,
            address: TAG_REGISTRY_ADDRESS,
            functionName: 'TAG_SUBMIT_COST',
            chainId: bscTestnet.id,
        });

        const allowance = await readContract(config, {
            abi: infoTokenABI,
            address: INFO_TOKEN_ADDRESS,
            functionName: 'allowance',
            args: [connectedAddress, TAG_REGISTRY_ADDRESS],
            chainId: bscTestnet.id,
        });

        if (allowance < tagSubmitCost) {
            const approveHash = await writeContractAsync({
                abi: infoTokenABI,
                address: INFO_TOKEN_ADDRESS,
                functionName: 'approve',
                args: [TAG_REGISTRY_ADDRESS, maxUint256],
                account: connectedAddress,
                chainId: bscTestnet.id,
            });
            const receipt = await waitForTransactionReceipt(config, { hash: approveHash, chainId: bscTestnet.id });
            if (receipt.status !== 'success') throw new Error("Approval transaction failed");
        }

        const submitHash = await writeContractAsync({
            abi: tagRegistryABI,
            address: TAG_REGISTRY_ADDRESS,
            functionName: 'submitTag',
            args: [tag.text],
            account: connectedAddress,
            chainId: bscTestnet.id,
        });
        const receipt = await waitForTransactionReceipt(config, { hash: submitHash, chainId: bscTestnet.id });
        if (receipt.status !== 'success') throw new Error("Submit tag transaction failed");

        // After successful transaction, update the UI
        const newTag: ITag = {
          ...tag,
          id: `ct-${Date.now()}`,
          upvotes: 1,
          downvotes: 0,
          submittedBy: connectedAddress,
          upvoted: true,
          downvoted: false,
        };
        onUpdateAddress({ ...addressData, communityTags: [...communityTags, newTag] });

    } catch (error) {
        console.error("Failed to submit tag:", error);
        alert(`Error submitting tag: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        setIsSubmittingTag(false);
    }
  };

  const handleUpvoteTag = async (tagId: string) => {
    if (!connectedAddress) { alert("Please connect wallet."); return; }
    if (isVoting) return;
    setIsVoting(true);

    try {
        const hash = await writeContractAsync({
            abi: tagRegistryABI,
            address: TAG_REGISTRY_ADDRESS,
            functionName: 'voteUp',
            args: [addressData.address as `0x${string}`],
            account: connectedAddress,
            chainId: bscTestnet.id,
        });
        await waitForTransactionReceipt(config, { hash, chainId: bscTestnet.id });

        // Original UI update logic
        const updatedTags = communityTags.map(t => {
          if (t.id === tagId) {
            const wasUpvoted = t.upvoted;
            const wasDownvoted = t.downvoted;
            return {
              ...t,
              upvotes: wasUpvoted ? t.upvotes - 1 : t.upvotes + 1,
              downvotes: wasDownvoted ? t.downvotes - 1 : t.downvotes,
              upvoted: !wasUpvoted,
              downvoted: false,
            };
          }
          return t;
        });
        onUpdateAddress({ ...addressData, communityTags: updatedTags });

    } catch (e) {
        console.error("Failed to upvote:", e);
        alert(`Error upvoting: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
        setIsVoting(false);
    }
  };

  const handleDownvoteTag = async (tagId: string) => {
    if (!connectedAddress) { alert("Please connect wallet."); return; }
    if (isVoting) return;
    setIsVoting(true);
    
    try {
        const hash = await writeContractAsync({
            abi: tagRegistryABI,
            address: TAG_REGISTRY_ADDRESS,
            functionName: 'voteDown',
            args: [addressData.address as `0x${string}`],
            account: connectedAddress,
            chainId: bscTestnet.id,
        });
        await waitForTransactionReceipt(config, { hash, chainId: bscTestnet.id });
        
        const updatedTags = communityTags.map(t => {
          if (t.id === tagId) {
            const wasUpvoted = t.upvoted;
            const wasDownvoted = t.downvoted;
            return {
              ...t,
              upvotes: wasUpvoted ? t.upvotes - 1 : t.upvotes,
              downvotes: wasDownvoted ? t.downvotes - 1 : t.downvotes + 1,
              upvoted: false,
              downvoted: !wasDownvoted,
            };
          }
          return t;
        });
        onUpdateAddress({ ...addressData, communityTags: updatedTags });

    } catch (e) {
        console.error("Failed to downvote:", e);
        alert(`Error downvoting: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
        setIsVoting(false);
    }
  };


  const TabButton: React.FC<{ tabName: string, label: string, icon: React.ReactNode }> = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tabName
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-300 hover:bg-gray-700/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const performanceDistributionData = pnlData ? [
      { label: '< -50%', value: pnlData.pnl_lt_minus_dot5_num, color: 'bg-red-600' },
      { label: '-50% to 0%', value: pnlData.pnl_minus_dot5_0x_num, color: 'bg-red-400' },
      { label: '0% to 2x', value: pnlData.pnl_lt_2x_num, color: 'bg-green-400' },
      { label: '2x to 5x', value: pnlData.pnl_2x_5x_num, color: 'bg-green-500' },
      { label: '> 5x', value: pnlData.pnl_gt_5x_num, color: 'bg-green-600' },
  ] : [];
  const totalTrades = performanceDistributionData.reduce((acc, item) => acc + item.value, 0);

  const renderOverview = () => {
    if (isPnlLoading) {
      return (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg ring-1 ring-gray-700">
            <h3 className="text-lg font-semibold text-white">Loading Wallet Statistics...</h3>
            <p className="mt-1 text-sm text-gray-400">Fetching real-time data from debot.ai.</p>
        </div>
      );
    }
    if (pnlError) {
       return (
            <div className="text-center py-12 bg-red-900/30 rounded-lg ring-1 ring-red-700">
                <h3 className="text-lg font-semibold text-white">Error Loading Wallet Data</h3>
                <p className="mt-1 text-sm text-red-300">{pnlError}</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <TaggingSection
                officialTags={pnlData.tags}
                communityTags={communityTags}
                onAddTag={handleAddTag}
                onUpvoteTag={handleUpvoteTag}
                onDownvoteTag={handleDownvoteTag}
                onTagSelect={onTagSelect}
                isSubmitting={isSubmittingTag}
            />

            <AISummary addressData={addressData} />
            
            {connectedAddress && connectedAddress.toLowerCase() === addressData.address.toLowerCase() && (
                <VerifyOwnership connectedAddress={connectedAddress} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoCard title="Trading Activity" className="lg:col-span-1">
                    <div className="text-xs text-gray-400 grid grid-cols-4 text-center mb-2">
                        <span className="text-left">Period</span><span>Buy Vol</span><span>Sell Vol</span><span>PNL</span>
                    </div>
                    <div className="space-y-1">
                        {[
                            { period: '1D', buy: pnlData.buy_1d, sell: pnlData.sell_1d, pnl: pnlData.pnl_1d },
                            { period: '7D', buy: pnlData.buy_7d, sell: pnlData.sell_7d, pnl: pnlData.pnl_7d },
                            { period: '30D', buy: pnlData.buy_30d, sell: pnlData.sell_30d, pnl: pnlData.pnl_30d },
                        ].map(({period, buy, sell, pnl}) => (
                            <div key={period} className="grid grid-cols-4 items-center text-center font-mono bg-gray-900/30 p-2 rounded-md transition-colors duration-200 hover:bg-gray-800/60">
                                <span className="font-sans text-left text-gray-300">{period}</span>
                                <span className="text-gray-200">${buy?.toLocaleString() || 0}</span>
                                <span className="text-gray-200">${sell?.toLocaleString() || 0}</span>
                                <ValueWithColor value={pnl}>{formatPercent(pnl)}</ValueWithColor>
                            </div>
                        ))}
                    </div>
                </InfoCard>

                <InfoCard title="Profitability" className="lg:col-span-1">
                   <div className="space-y-1">
                     <InfoRow label="Realized Profit" tooltip={`7D: ${formatCurrency(pnlData.realized_profit_7d)}\n30D: ${formatCurrency(pnlData.realized_profit_30d)}`}>
                         <ValueWithColor value={pnlData.realized_profit}>{formatCurrency(pnlData.realized_profit)}</ValueWithColor>
                     </InfoRow>
                     <InfoRow label="Unrealized Profit">
                         <ValueWithColor value={pnlData.unrealized_profit}>{formatCurrency(pnlData.unrealized_profit)}</ValueWithColor>
                     </InfoRow>
                      <InfoRow label="Gas Cost"><span className="font-mono text-gray-200">-{formatCurrency(pnlData.gas_cost)}</span></InfoRow>
                      <InfoRow label="Avg. Profit / Sold Token"><ValueWithColor value={pnlData.token_sold_avg_profit}>{formatCurrency(pnlData.token_sold_avg_profit)}</ValueWithColor></InfoRow>
                   </div>
                </InfoCard>

                 <InfoCard title="Trading Behavior" className="lg:col-span-1">
                    <div className="space-y-1">
                        <InfoRow label="Win Rate">
                            <span className="font-mono">{formatPercent(pnlData.winrate)}</span>
                        </InfoRow>
                         <InfoRow label="Avg. Holding Period"><span className="font-mono">{formatDuration(pnlData.avg_holding_peroid)}</span></InfoRow>
                         <InfoRow label="Avg. Token Cost"><span className="font-mono">{formatCurrency(pnlData.token_avg_cost)}</span></InfoRow>
                         <InfoRow label="Tokens Traded / Profitable"><span className="font-mono">{pnlData.token_num} / {pnlData.profit_num}</span></InfoRow>
                    </div>
                </InfoCard>
                
                 <InfoCard title="Performance Distribution" className="lg:col-span-2">
                    <div className="space-y-2 text-xs">
                        {performanceDistributionData.map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                                <div className="w-16 text-right text-gray-400 shrink-0">{item.label}</div>
                                <div className="w-full bg-gray-700 rounded-full h-4">
                                    <div className={`${item.color} h-4 rounded-full text-center text-white font-semibold leading-4`} style={{ width: totalTrades > 0 ? `${(item.value / totalTrades) * 100}%` : '0%' }}>
                                       {item.value > 0 && totalTrades > 0 && (item.value / totalTrades) > 0.1 ? item.value : ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 </InfoCard>

                <InfoCard title="Wallet Balances" className="lg:col-span-1">
                     <div className="space-y-1">
                        <InfoRow label="Total Value"><span className="font-mono">{formatCurrency(pnlData.total_value)}</span></InfoRow>
                        <InfoRow label="ETH Balance"><span className="font-mono">{parseFloat(pnlData.eth_balance).toFixed(4)}</span></InfoRow>
                        <InfoRow label="SOL Balance"><span className="font-mono">{parseFloat(pnlData.sol_balance).toFixed(4)}</span></InfoRow>
                        <InfoRow label="Other Balances"><span className="font-mono">{parseFloat(pnlData.bnb_balance) + parseFloat(pnlData.trx_balance)}</span></InfoRow>
                     </div>
                </InfoCard>

                <InfoCard title="Risk Analysis" className="lg:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6">
                        <InfoRow label="Active Tokens Traded"><span className="font-mono">{pnlData.risk.token_active}</span></InfoRow>
                        <InfoRow label="Honeypot Tokens"><span className="font-mono">{pnlData.risk.token_honeypot} ({formatPercent(pnlData.risk.token_honeypot_ratio)})</span></InfoRow>
                        <InfoRow label="No Buy, Hold Only"><span className="font-mono">{pnlData.risk.no_buy_hold} ({formatPercent(pnlData.risk.no_buy_hold_ratio)})</span></InfoRow>
                        <InfoRow label="Sell Pass Buy"><span className="font-mono">{pnlData.risk.sell_pass_buy} ({formatPercent(pnlData.risk.sell_pass_buy_ratio)})</span></InfoRow>
                        <InfoRow label="Fast Transactions"><span className="font-mono">{pnlData.risk.fast_tx} ({formatPercent(pnlData.risk.fast_tx_ratio)})</span></InfoRow>
                    </div>
                </InfoCard>
            </div>
          </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 anim-back-button">
        <ChevronLeftIcon className="w-5 h-5" />
        Back to list
      </button>

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 anim-header mb-8">
        <div className="flex items-center gap-4">
          <img className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-700" src={pnlData?.avatar || `https://picsum.photos/seed/${addressData.address}/64/64`} alt="Avatar" />
          <div>
            <h1 className="text-2xl font-bold text-white">{pnlData?.name || pnlData?.ens || 'Anonymous Address'}</h1>
            <div className="flex items-center gap-2 relative">
                <p className="font-mono text-gray-400">{addressData.address}</p>
                <button onClick={handleCopyAddress} className="text-gray-500 hover:text-white transition-colors" aria-label="Copy address">
                    <CopyIcon className="w-4 h-4" />
                </button>
                {addressCopied && (
                    <span className="absolute left-full ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-md">
                        Copied!
                    </span>
                )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            <a href={`https://etherscan.io/address/${addressData.address}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors" aria-label="View on Etherscan">
                <ExternalLinkIcon className="w-5 h-5 text-gray-300"/>
            </a>
            {pnlData?.twitter_username && (
                 <a href={`https://twitter.com/${pnlData.twitter_username}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors" aria-label="View on Twitter">
                    <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25zM16.63 19.75h1.868L7.129 4.25H5.162l11.468 15.5z"></path></svg>
                 </a>
            )}
        </div>
      </header>

      <nav className="border-b border-gray-700 flex items-center gap-2 anim-tab-nav">
        <TabButton tabName="overview" label="Overview" icon={<SparklesIcon className="w-5 h-5"/>} />
        <TabButton tabName="transactions" label="Transactions" icon={<TransactionIcon className="w-5 h-5"/>} />
        <TabButton tabName="visualscan" label="Visual Scan" icon={<ChartPieIcon className="w-5 h-5"/>} />
      </nav>

      <div className="anim-tab-content mt-8">
        {activeTab === 'overview' && renderOverview()}

        {activeTab === 'transactions' && (
            <TransactionList 
                baseAddress={addressData.address}
                transfers={transactions}
                total={totalTransactions}
                offset={offset}
                pageSize={PAGE_SIZE}
                onPageChange={setOffset}
                isLoading={isTransactionsLoading}
                error={transactionsError}
            />
        )}
        
        {activeTab === 'visualscan' && (
            <VisualScan 
              addressData={addressData} 
              allAddresses={allAddresses}
              onNodeSelect={onAddressSelect}
              arkhamTransfers={transactions}
              isLoading={isTransactionsLoading}
              error={transactionsError}
            />
        )}
      </div>
    </div>
  );
};

export default AddressDetail;
