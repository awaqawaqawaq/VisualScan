

import React, { useRef, useEffect, useMemo } from 'react';
import * as echarts from 'echarts';
import { AddressData, ArkhamTransfer } from '../../types';
import { createAddressDataFromApiTags } from '../../data/loader';

type EChartsOption = any;

interface VisualScanProps {
  addressData: AddressData;
  allAddresses: AddressData[];
  arkhamTransfers?: ArkhamTransfer[];
  isLoading: boolean;
  onNodeSelect?: (address: AddressData) => void;
  error: string | null;
}

const getExplorerLink = (chain: string, txHash: string) => {
    switch (chain.toLowerCase()) {
        case 'solana': return `https://solscan.io/tx/${txHash}`;
        case 'bsc': return `https://bscscan.com/tx/${txHash}`;
        case 'polygon': return `https://polygonscan.com/tx/${txHash}`;
        case 'arbitrum': return `https://arbiscan.io/tx/${txHash}`;
        case 'optimism': return `https://optimistic.etherscan.io/tx/${txHash}`;
        case 'avalanche': return `https://snowtrace.io/tx/${txHash}`;
        case 'ethereum': default: return `https://etherscan.io/tx/${txHash}`;
    }
};

const VisualScan: React.FC<VisualScanProps> = ({ addressData, allAddresses, arkhamTransfers, isLoading, onNodeSelect, error }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { pnlData } = addressData;

  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const existingNodeIds = new Set<string>();
    
    if (!arkhamTransfers || arkhamTransfers.length === 0) {
        return { nodes, links };
    }

    const centralAddress = addressData.address.toLowerCase();
    nodes.push({
      id: centralAddress,
      name: pnlData.ens || pnlData.name || `${addressData.address.substring(0, 6)}...`,
      symbolSize: 60,
      category: 0,
      tags: pnlData.tags,
      x: 0, y: 0,
      fixed: true,
      value: addressData.address,
    });
    existingNodeIds.add(centralAddress);
    
    arkhamTransfers.forEach((tx) => {
        const fromAddress = tx.fromAddress.address.toLowerCase();
        const toAddress = tx.toAddress.address.toLowerCase();
        const counterparty = fromAddress === centralAddress ? tx.toAddress : tx.fromAddress;
        const counterpartyAddress = counterparty.address.toLowerCase();

        if (!existingNodeIds.has(counterpartyAddress)) {
            const isSource = toAddress === centralAddress;
            const tags = [counterparty.arkhamEntity?.type, counterparty.arkhamLabel?.name].filter(Boolean) as string[];
            const isRisk = tags.some(tag => tag.toLowerCase().includes('sanctioned') || tag.toLowerCase().includes('warning') || tag.toLowerCase().includes('mixer'));
            
            nodes.push({
                id: counterpartyAddress,
                name: counterparty.arkhamEntity?.name || counterparty.arkhamLabel?.name || `${counterparty.address.substring(0, 6)}...`,
                symbolSize: 40,
                category: isRisk ? 3 : (isSource ? 1 : 2),
                tags: tags,
                value: counterparty.address,
            });
            existingNodeIds.add(counterpartyAddress);
        }

        links.push({
            source: fromAddress,
            target: toAddress,
            value: tx.historicalUSD,
            lineStyle: { width: Math.max(0.75, Math.log(tx.historicalUSD + 1) / 2.5) },
            txHash: tx.transactionHash,
            chain: tx.chain
        });
    });

    return { nodes, links };
  }, [addressData, arkhamTransfers]);

  useEffect(() => {
    let chartInstance: echarts.ECharts | null = null;
    
    const addressMap = allAddresses.reduce((acc, addr) => {
        acc[addr.address.toLowerCase()] = addr;
        return acc;
    }, {} as Record<string, AddressData>);

    if (chartRef.current && graphData.nodes.length > 0) {
      chartInstance = echarts.init(chartRef.current, 'dark', { renderer: 'canvas' });

      const option: EChartsOption = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(29, 29, 31, 0.6)', // Deep charcoal at 60% opacity for a dark glass effect
          borderColor: 'rgba(55, 65, 81, 0.7)', // gray-700 at 70%
          borderWidth: 1,
          padding: 12,
          textStyle: {
            color: '#ffffff' // Bright white for high contrast text
          },
          extraCssText: 'backdrop-filter: blur(8px); box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); border-radius: 0.75rem;',
          formatter: (params: any) => {
            if (params.dataType === 'node') {
              const node = params.data;
              const tagsHtml = node.tags && node.tags.length > 0
                ? `<div class="mt-2 pt-2 border-t border-gray-600/80"><strong class="text-xs text-gray-400">Tags:</strong><div class="flex flex-wrap gap-1 mt-1">${node.tags.slice(0, 3).map((tag: string) => `<span class="text-xs bg-gray-700/80 text-gray-200 ring-1 ring-inset ring-gray-600/50 px-1.5 py-0.5 rounded-full font-medium">${tag}</span>`).join('')}</div></div>`
                : '';
              const clickHint = node.id.toLowerCase() !== addressData.address.toLowerCase()
                ? `<div class="text-xs text-blue-400 mt-2">Click node to view details</div>`
                : '';
              return `<div class="font-sans p-1 max-w-xs"><div class="font-bold text-white">${node.name}</div><div class="text-xs text-gray-400 break-all">${node.id}</div>${tagsHtml}${clickHint}</div>`;
            }
            if (params.dataType === 'edge') {
              const edge = params.data;
              return `<div class="font-sans p-1 text-white"><div><strong>Transfer Value:</strong> ${edge.value.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}</div><div class="text-xs text-gray-400 mt-1"><strong>Tx:</strong> ${edge.txHash.substring(0, 14)}...</div><div class="text-xs text-blue-400 mt-2">Click edge to view on explorer</div></div>`;
            }
            return '';
          },
        },
        legend: [{
          data: ['This Address', 'Source', 'Destination', 'Risk'],
          textStyle: { color: '#D1D5DB' },
          bottom: 10,
          left: 'center'
        }],
        series: [
          {
            type: 'graph',
            layout: 'force',
            nodes: graphData.nodes,
            links: graphData.links,
            categories: [
              { name: 'This Address', itemStyle: { color: '#2563EB', borderColor: '#3B82F6' } },
              { name: 'Source', itemStyle: { color: '#16A34A', borderColor: '#22C55E' } },
              { name: 'Destination', itemStyle: { color: '#D97706', borderColor: '#EAB308' } },
              { name: 'Risk', itemStyle: { color: '#DC2626', borderColor: '#F87171' } }
            ],
            roam: true,
            label: { show: true, position: 'right', formatter: '{b}', color: '#D1D5DB', fontSize: 12 },
            lineStyle: { color: 'source', curveness: 0.1, opacity: 0.7, width: 0.75 },
            emphasis: { focus: 'adjacency', lineStyle: { width: 3, opacity: 1 } },
            force: { repulsion: 1200, gravity: 0.05, edgeLength: [450, 600] },
            draggable: true,
          }
        ]
      };

      chartInstance.setOption(option);
      
      chartInstance.on('click', (params: any) => {
        if (params.dataType === 'edge') {
          const edgeData = params.data;
          if (edgeData.txHash && edgeData.chain) {
            window.open(getExplorerLink(edgeData.chain, edgeData.txHash), '_blank');
          }
        }
        if (params.dataType === 'node') {
          const clickedAddress = params.data.id?.toLowerCase();
          if (onNodeSelect && clickedAddress && clickedAddress !== addressData.address.toLowerCase()) {
              const foundAddress = addressMap[clickedAddress];
              if (foundAddress) {
                  onNodeSelect(foundAddress);
              } else {
                  // Create a temporary profile for the unknown address and navigate
                  const newAddressData = createAddressDataFromApiTags(clickedAddress, []);
                  onNodeSelect(newAddressData);
              }
          }
        }
      });

      const resizeHandler = () => chartInstance?.resize();
      window.addEventListener('resize', resizeHandler);

      return () => {
        window.removeEventListener('resize', resizeHandler);
        chartInstance?.dispose();
      };
    }
  }, [addressData, allAddresses, graphData, onNodeSelect]);
  
  if (isLoading) {
    return (
        <div className="bg-gray-800/50 rounded-lg p-6 ring-1 ring-gray-700 text-center py-12">
            <h3 className="text-lg font-semibold text-white">Generating Visual Scan...</h3>
            <p className="mt-1 text-sm text-gray-400">Analyzing transaction graph from Arkham data.</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="bg-gray-800/50 rounded-lg p-6 ring-1 ring-gray-700 text-center py-12">
            <h3 className="text-lg font-semibold text-white text-red-400">Could Not Generate Visual Scan</h3>
            <p className="mt-1 text-sm text-gray-400">{error}</p>
            <p className="mt-2 text-xs text-gray-500">This may be due to a network issue or a CORS policy from the Arkham API.</p>
        </div>
    );
  }

  if (!arkhamTransfers || arkhamTransfers.length === 0) {
    return (
        <div className="bg-gray-800/50 rounded-lg p-6 ring-1 ring-gray-700 text-center py-12">
            <h3 className="text-lg font-semibold text-white">No Transaction Data to Visualize</h3>
            <p className="mt-1 text-sm text-gray-400">Could not find any recent transactions to build the interaction graph.</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 ring-1 ring-gray-700 anim-visualscan">
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Visual Scan: Interaction Graph</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            An interactive visualization of fund flows. Hover over elements for details, click edges to view transactions on-chain.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <select className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" aria-label="Time range filter">
            <option>Current Page Transactions</option>
          </select>
        </div>
      </div>
      
      <div
        ref={chartRef}
        className="w-full h-[500px] mt-6 bg-gray-900/30 rounded-lg"
        aria-label="Fund flow interaction graph"
      ></div>

      <div className="mt-6 p-4 bg-gray-900/50 rounded-lg ring-1 ring-gray-700">
        <h4 className="font-semibold text-white mb-2">Key Insights & Development Notes</h4>
        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
          <li>This graph is generated from the transactions currently displayed in the 'Transactions' tab.</li>
          <li>A node highlighted in <span className="text-red-400 font-semibold">red</span> indicates potential risk (e.g., interaction with a mixer or sanctioned entity).</li>
          <li>Clicking on other wallet nodes will navigate to their respective detail pages for deeper exploration.</li>
        </ul>
      </div>
    </div>
  );
};

export default VisualScan;