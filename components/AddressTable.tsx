

import React, { useLayoutEffect, useRef, useEffect } from 'react';
import { AddressData, SortKey, SortDirection, Tag as ITag } from '../types';
import Tag from './Tag';
import { ArrowUpIcon, ArrowDownIcon } from './icons';
import { gsap } from 'gsap';
import { mapOfficialTag } from '../utils/tags';

interface AddressTableProps {
  addresses: AddressData[];
  onAddressSelect: (address: AddressData) => void;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  loadMore: () => void;
  hasMore: boolean;
}

const SortableHeader: React.FC<{ title: string; sortKey: SortKey; currentSortKey: SortKey; sortDirection: SortDirection; onSort: (key: SortKey) => void; className?: string }> = 
({ title, sortKey, currentSortKey, sortDirection, onSort, className }) => {
  const isCurrentKey = sortKey === currentSortKey;
  return (
    <th scope="col" className={`py-3.5 text-left text-sm font-semibold text-white ${className}`}>
      <div 
        className="group inline-flex cursor-pointer"
        onClick={() => onSort(sortKey)}
      >
        {title}
        <span className={`ml-2 flex-none rounded ${isCurrentKey ? 'bg-gray-700 text-white' : 'text-gray-400 invisible group-hover:visible'}`}>
            {isCurrentKey && sortDirection === 'asc' ? <ArrowUpIcon className="h-5 w-5" /> : <ArrowDownIcon className="h-5 w-5" />}
        </span>
      </div>
    </th>
  );
};


const AddressTableRow: React.FC<{ address: AddressData; onAddressSelect: (address: AddressData) => void; }> = ({ address, onAddressSelect }) => {
  const { pnlData, communityTags } = address;
  const profitPercentageOfVolume = pnlData.total_volume > 0 ? Math.min(100, (Math.abs(pnlData.realized_profit) / pnlData.total_volume) * 100) : 0;
  
  const officialDisplayTags = pnlData.tags.map(mapOfficialTag);

  const displayTags = [...officialDisplayTags, ...(communityTags || [])]
    .sort((a,b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));

  const hasName = pnlData.ens || pnlData.name;
  const truncatedAddress = `${address.address.substring(0, 6)}...${address.address.substring(address.address.length - 4)}`;
  const mainLineText = hasName ? (pnlData.ens || pnlData.name) : `0x${address.address.substring(2, 6)}`;
  const subLineText = truncatedAddress;

  return (
    <tr onClick={() => onAddressSelect(address)} className="hover:bg-gray-800/50 cursor-pointer transition-colors duration-150">
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <img className="h-10 w-10 rounded-full object-cover" src={pnlData.avatar || `https://picsum.photos/seed/${address.address}/40/40`} alt="Avatar" />
          </div>
          <div className="ml-4 relative group">
            <div className="font-medium text-white">{mainLineText}</div>
            <div className="text-gray-400">{subLineText}</div>
            <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs bg-gray-700 text-white text-xs rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ring-1 ring-gray-600 z-20">
              {address.address}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-700"></div>
            </div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
        <div className="flex flex-wrap gap-1 items-center">
          {displayTags.slice(0, 2).map(tag => (
            <div key={tag.id}>
               <Tag tag={tag} isOfficial={tag.isOfficial} />
            </div>
          ))}
          {displayTags.length > 2 && (
             <div className="relative group">
                <span className="text-xs self-center bg-gray-700 px-2 py-1 rounded-full cursor-default">
                  +{displayTags.length - 2}
                </span>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-sm bg-gray-700 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ring-1 ring-gray-600 z-20">
                  <div className="flex flex-wrap gap-2">
                    {displayTags.slice(2).map(tag => (
                      <Tag key={tag.id} tag={tag} isOfficial={tag.isOfficial} disableTooltip={true} />
                    ))}
                  </div>
                </div>
              </div>
          )}
        </div>
      </td>
       <td className="whitespace-nowrap px-3 py-4 text-sm font-mono relative group align-middle">
        <span className={pnlData.realized_profit >= 0 ? 'text-green-400' : 'text-red-400'}>
          ${pnlData.realized_profit.toLocaleString()}
        </span>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 bg-gray-700 text-white rounded-md p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg ring-1 ring-gray-600 z-20 text-left normal-case">
            <div className="font-bold text-sm mb-2 text-white">Profit Analysis</div>
            <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Realized P/L</span>
                    <span className={`font-mono ${pnlData.realized_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${pnlData.realized_profit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Volume</span>
                    <span className="font-mono text-gray-300">${pnlData.total_volume.toLocaleString()}</span>
                </div>
            </div>
            <div className="mt-3">
                <div className="text-gray-400 text-xs mb-1">Profit as % of Volume</div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                        className={`${pnlData.realized_profit >= 0 ? 'bg-green-500' : 'bg-red-500'} h-2 rounded-full`} 
                        style={{width: `${profitPercentageOfVolume}%`}}>
                    </div>
                </div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-700"></div>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 font-mono">${pnlData.total_volume.toLocaleString()}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 font-mono">{`${(pnlData.winrate * 100).toFixed(1)}%`}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{new Date(pnlData.last_active_timestamp * 1000).toLocaleDateString()}</td>
    </tr>
  );
};

const AddressTable: React.FC<AddressTableProps> = ({ addresses, onAddressSelect, sortKey, sortDirection, onSort, loadMore, hasMore }) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  useLayoutEffect(() => {
    if (tableRef.current) {
        const ctx = gsap.context(() => {
            gsap.from("tbody tr", {
                y: 20,
                opacity: 0,
                duration: 0.3,
                stagger: 0.05,
                ease: "power3.out"
            });
        }, tableRef);
        return () => ctx.revert();
    }
  }, [addresses]);

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;
    
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                loadMore();
            }
        },
        { rootMargin: '0px 0px 200px 0px' } // Trigger when 200px from bottom
    );

    const currentRef = loadMoreRef.current;
    observer.observe(currentRef);

    return () => {
        if (currentRef) {
            observer.unobserve(currentRef);
        }
    };
  }, [hasMore, loadMore]);

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table ref={tableRef} className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <SortableHeader title="Address" sortKey={SortKey.INFLUENCE} currentSortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="pl-4 sm:pl-6"/>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Top Tags</th>
                <SortableHeader title="Profit" sortKey={SortKey.PROFIT} currentSortKey={sortKey} sortDirection={sortDirection} onSort={onSort} />
                <SortableHeader title="Volume" sortKey={SortKey.VOLUME} currentSortKey={sortKey} sortDirection={sortDirection} onSort={onSort} />
                <SortableHeader title="Win Rate" sortKey={SortKey.WIN_RATE} currentSortKey={sortKey} sortDirection={sortDirection} onSort={onSort} />
                <SortableHeader title="Last Active" sortKey={SortKey.LAST_ACTIVE} currentSortKey={sortKey} sortDirection={sortDirection} onSort={onSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {addresses.map((address) => (
                <AddressTableRow key={address.id} address={address} onAddressSelect={onAddressSelect} />
              ))}
            </tbody>
          </table>
          <div ref={loadMoreRef} className="h-1" />
          {hasMore && (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressTable;