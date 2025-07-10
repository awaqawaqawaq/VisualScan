
import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { AddressData, SortKey, SortDirection, Tag as ITag, AxiomApiTag } from './types';
import { initialAddresses } from './data/loader';
import AddressTable from './components/AddressTable';
import AddressDetail from './components/detail/AddressDetail';
import TagDetail from './components/detail/TagDetail';
import { SearchIcon } from './components/icons';
import { gsap } from 'gsap';
import { fetchTagsForAddress } from './api';
import { createAddressDataFromApiTags } from './data/loader';
import Tag from './components/Tag';
import { mapOfficialTag } from './utils/tags';
import ConnectWalletButton from './components/ConnectWalletButton';
import { useAccount } from 'wagmi';

const BATCH_SIZE = 20;

type ApiSearchStatus = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error', message: string }
  | { status: 'found', address: string, tags: AxiomApiTag[] }
  | { status: 'notFound', address: string };

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


export const App: React.FC = () => {
  const [addresses, setAddresses] = useState<AddressData[]>(initialAddresses);
  const [filteredAddresses, setFilteredAddresses] = useState<AddressData[]>([]);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [selectedTag, setSelectedTag] = useState<ITag | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>(SortKey.INFLUENCE);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.DESC);
  
  const [apiSearchState, setApiSearchState] = useState<ApiSearchStatus>({ status: 'idle' });
  
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { address: connectedAddress } = useAccount();

  const sortData = useCallback((data: AddressData[], key: SortKey, direction: SortDirection): AddressData[] => {
    const sortedData = [...data].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch(key) {
        case SortKey.PROFIT:
          valA = a.pnlData.realized_profit;
          valB = b.pnlData.realized_profit;
          break;
        case SortKey.VOLUME:
          valA = a.pnlData.total_volume;
          valB = b.pnlData.total_volume;
          break;
        case SortKey.LAST_ACTIVE:
          valA = a.pnlData.last_active_timestamp;
          valB = b.pnlData.last_active_timestamp;
          break;
        case SortKey.WIN_RATE:
          valA = a.pnlData.winrate;
          valB = b.pnlData.winrate;
          break;
        case SortKey.INFLUENCE:
        default:
          valA = a.pnlData.followers_count;
          valB = b.pnlData.followers_count;
          break;
      }

      if (valA < valB) return direction === SortDirection.ASC ? -1 : 1;
      if (valA > valB) return direction === SortDirection.ASC ? 1 : -1;
      return 0;
    });
    return sortedData;
  }, []);

  useEffect(() => {
    let results = addresses.filter(addr => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const communityTagsMatch = addr.communityTags.some(tag => tag.text.toLowerCase().includes(lowerSearchTerm));
        return (
            addr.address.toLowerCase().includes(lowerSearchTerm) ||
            (addr.pnlData.ens && addr.pnlData.ens.toLowerCase() !== 'n/a' && addr.pnlData.ens.toLowerCase().includes(lowerSearchTerm)) ||
            (addr.pnlData.name && addr.pnlData.name.toLowerCase() !== 'n/a' && addr.pnlData.name.toLowerCase().includes(lowerSearchTerm)) ||
            addr.pnlData.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)) ||
            communityTagsMatch
        );
    });
    setFilteredAddresses(sortData(results, sortKey, sortDirection));
  }, [searchTerm, addresses, sortKey, sortDirection, sortData]);

  useEffect(() => {
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(debouncedSearchTerm);
    const addressExists = addresses.some(addr => addr.address.toLowerCase() === debouncedSearchTerm.toLowerCase());

    if (isAddress && !addressExists) {
      const search = async () => {
        setApiSearchState({ status: 'loading' });
        try {
          const result = await fetchTagsForAddress(debouncedSearchTerm);
          
          if (result && result.tags.length > 0) {
            setApiSearchState({ status: 'found', address: debouncedSearchTerm, tags: result.tags });
          } else {
            setApiSearchState({ status: 'notFound', address: debouncedSearchTerm });
          }
        } catch (error) {
          console.error("API search failed:", error);
          const message = error instanceof Error ? error.message : "An unknown error occurred.";
          setApiSearchState({ status: 'error', message: `Failed to query the address via Axiom: ${message}` });
        }
      };
      search();
    } else {
      setApiSearchState({ status: 'idle' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);


  useLayoutEffect(() => {
    if (!selectedAddress && !selectedTag && mainContainerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".anim-header-content", {
          y: -20,
          opacity: 0,
          duration: 0.5,
          ease: "power3.out",
        });
        gsap.from(".anim-main-content > *", {
          y: 20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.2
        });
      }, mainContainerRef);
      return () => ctx.revert();
    }
  }, [selectedAddress, selectedTag]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
        setSortDirection(prev => prev === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC);
    } else {
        setSortKey(key);
        setSortDirection(SortDirection.DESC);
    }
    setVisibleCount(BATCH_SIZE); // Reset for new sort
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setApiSearchState({ status: 'idle' });
    setVisibleCount(BATCH_SIZE); // Reset for new search
  };
  
  const loadMoreAddresses = useCallback(() => {
    if (visibleCount >= filteredAddresses.length) return;
    setVisibleCount(prevCount => prevCount + BATCH_SIZE);
  }, [visibleCount, filteredAddresses.length]);

  const handleUpdateAddress = (updatedAddress: AddressData) => {
    setAddresses(prevAddresses => {
        const index = prevAddresses.findIndex(addr => addr.id === updatedAddress.id);
        if (index > -1) {
            const newAddresses = [...prevAddresses];
            newAddresses[index] = updatedAddress;
            return newAddresses;
        }
        return prevAddresses;
    });

    if (selectedAddress && selectedAddress.id === updatedAddress.id) {
        setSelectedAddress(updatedAddress);
    }
};


  const handleSelectAddress = (address: AddressData) => {
    setSelectedTag(null);
    // If the address is not in the main list (i.e., it's a new one from VisualScan), add it.
    if (!addresses.some(a => a.id === address.id)) {
        setAddresses(prev => [address, ...prev]);
    }
    setSelectedAddress(address);
  };

  const handleSelectTag = (tag: ITag) => {
      setSelectedAddress(null);
      setSelectedTag(tag);
  }

  const handleBackFromDetail = () => {
    setSelectedAddress(null);
    setSelectedTag(null);
  };

  const handleAddApiFoundAddress = () => {
    if (apiSearchState.status !== 'found') return;

    const newAddressData = createAddressDataFromApiTags(apiSearchState.address, apiSearchState.tags);
    setAddresses(prev => [newAddressData, ...prev]);

    setSearchTerm(apiSearchState.address);
    setApiSearchState({ status: 'idle' });
  };

  const handleManualTagging = () => {
    if (apiSearchState.status !== 'notFound') return;
    const newAddressData = createAddressDataFromApiTags(apiSearchState.address, []);
    setSelectedAddress(newAddressData);
    setApiSearchState({ status: 'idle' });
  };
  
  const renderApiSearchResult = () => {
    switch (apiSearchState.status) {
      case 'loading':
        return (
          <div className="mt-4 text-center p-4 text-gray-400 bg-gray-800/50 rounded-lg">
            Querying new address via Axiom...
          </div>
        );
      case 'found':
        return (
          <div className="mt-4 text-center p-6 bg-gray-800 rounded-lg ring-1 ring-blue-500/50">
            <h3 className="text-lg font-semibold text-white">Address Found via Axiom!</h3>
            <p className="mt-1 text-sm text-gray-400">The following tags were discovered for this address.</p>
            <p className="mt-1 mb-4 text-sm font-mono text-gray-500">{apiSearchState.address}</p>
            <div className="flex flex-wrap justify-center items-center gap-2 mb-6">
              {apiSearchState.tags.map(apiTag => {
                const mappedTag = mapOfficialTag(apiTag.tagName);
                const tag: ITag = {
                    ...mappedTag,
                    id: `found-${apiTag.tagName}`,
                    upvotes: apiTag.count,
                    downvotes: 0,
                    submittedBy: 'MemeRadar',
                    isOfficial: false,
                    upvoted: false,
                    downvoted: false,
                };
                return <Tag key={tag.id} tag={tag} isOfficial={false} disableTooltip={true} />;
              })}
            </div>
            <button
              onClick={handleAddApiFoundAddress}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Add Address to Repository
            </button>
          </div>
        );
      case 'notFound':
        return (
          <div className="mt-4 text-center p-6 bg-gray-800/50 rounded-lg ring-1 ring-gray-700">
            <p className="text-white">Address not in our database.</p>
            <p className="mt-1 text-sm text-gray-400">No tags for this address were found in the Axiom database.</p>
            <button onClick={handleManualTagging} className="mt-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Click here to add a tag for it manually
            </button>
          </div>
        );
      case 'error':
        return (
          <div className="mt-4 text-center p-6 bg-red-900/30 rounded-lg ring-1 ring-red-700">
            <p className="text-white font-semibold">API Error</p>
            <p className="text-red-300">{apiSearchState.message}</p>
          </div>
        );
      case 'idle':
      default:
        return null;
    }
  }

  const renderContent = () => {
    if (selectedTag) {
        return <TagDetail 
            tag={selectedTag} 
            allAddresses={addresses}
            onBack={handleBackFromDetail}
            onAddressSelect={handleSelectAddress}
        />;
    }
    if (selectedAddress) {
        return <AddressDetail 
            addressData={selectedAddress} 
            allAddresses={addresses}
            onBack={handleBackFromDetail} 
            onUpdateAddress={handleUpdateAddress} 
            onAddressSelect={handleSelectAddress}
            onTagSelect={handleSelectTag}
            connectedAddress={connectedAddress}
        />;
    }
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 anim-main-content">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h2 className="text-2xl font-semibold leading-6 text-white">Address Repository</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Explore, analyze, and tag onchain addresses. Click on a row to view details.
                    </p>
                </div>
            </div>
            
            <div className="mt-6">
                <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="search"
                        name="search"
                        id="search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="block w-full rounded-md border-0 py-2.5 pl-10 bg-gray-800 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                        placeholder="Search by address, ENS, name, tag..."
                    />
                </div>
            </div>
            
            {filteredAddresses.length === 0 && renderApiSearchResult()}

            <AddressTable 
                addresses={filteredAddresses.slice(0, visibleCount)} 
                onAddressSelect={handleSelectAddress}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                loadMore={loadMoreAddresses}
                hasMore={visibleCount < filteredAddresses.length}
            />
          </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900" ref={mainContainerRef}>
      <header className="bg-gray-800/30 backdrop-blur-lg sticky top-0 z-10 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center anim-header-content">
          <div className="flex items-center gap-2">
            <span role="img" aria-label="brain emoji" className="text-2xl">👽</span>
            <h1 className="text-xl font-bold text-white">Open Onchain Intelligence</h1>
          </div>
          <ConnectWalletButton />
        </div>
      </header>

      <main>
        {renderContent()}
      </main>
    </div>
  );
};