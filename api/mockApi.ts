
import { ArkhamApiResponse, ArkhamTransfer } from '../types';

// --- START: Helper functions for mock data generation ---

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const randomAddress = (): string => `0x${[...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

const randomHash = (): string => `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

const TOKENS = [
    { name: 'Tether USD', symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    { name: 'Wrapped Ether', symbol: 'WETH', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18 },
    { name: 'Pepe', symbol: 'PEPE', address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', decimals: 18 },
    { name: 'Binance Coin', symbol: 'BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18 },
    { name: 'Dogecoin', symbol: 'DOGE', address: '0xba2ae424d960c26247dd6c32edc70b295c744c43', decimals: 8 },
];

const ENTITIES = [
    { name: 'Binance', type: 'cex', id: 'binance' },
    { name: 'Uniswap', type: 'dex', id: 'uniswap' },
    { name: 'MEV Bot', type: 'bot', id: 'mev-bot' },
    { name: 'Wintermute', type: 'market-maker', id: 'wintermute' },
    { name: 'a16z', type: 'vc', id: 'a16z' }
];

const LABELS = [
    { name: 'Hot Wallet', address: '0x0000000000000000000000000000000000000001', chainType: 'bsc' },
    { name: 'Cold Wallet', address: '0x0000000000000000000000000000000000000002', chainType: 'bsc' },
    { name: 'Router', address: '0x0000000000000000000000000000000000000003', chainType: 'bsc' },
    { name: 'Staking', address: '0x0000000000000000000000000000000000000004', chainType: 'bsc' }
];

// --- END: Helper functions ---


const generateMockTransfer = (baseAddress: string, index: number): ArkhamTransfer => {
    const isOut = Math.random() > 0.5;
    const counterpartyAddress = randomAddress();
    const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    const entity = ENTITIES[Math.floor(Math.random() * ENTITIES.length)];
    const label = LABELS[Math.floor(Math.random() * LABELS.length)];
    const txHash = randomHash();

    const fromAddress = {
        address: isOut ? baseAddress : counterpartyAddress,
        chain: 'bsc',
        arkhamEntity: entity,
        arkhamLabel: label,
    };
    
    const toAddress = {
        address: isOut ? counterpartyAddress : baseAddress,
        chain: 'bsc',
        arkhamEntity: ENTITIES[Math.floor(Math.random() * ENTITIES.length)],
        arkhamLabel: LABELS[Math.floor(Math.random() * LABELS.length)],
    };

    return {
        id: `${txHash}_${index}`,
        transactionHash: txHash,
        fromAddress: fromAddress,
        toAddress: toAddress,
        tokenAddress: token.address,
        tokenName: token.name,
        tokenSymbol: token.symbol,
        tokenDecimals: token.decimals,
        blockTimestamp: new Date(Date.now() - index * 60000 * rand(5, 60)).toISOString(),
        blockNumber: 53506149 - index,
        historicalUSD: rand(1, 100000),
        chain: 'bsc',
    };
};


// Cache to keep mock data consistent across paginated requests for the same address
const mockDataCache: Record<string, ArkhamTransfer[]> = {};

const SIMULATED_TOTAL_COUNT = 124; // A realistic total number of transactions

export const fetchMockArkhamTransfers = (
    baseAddress: string, 
    options: { offset?: number; limit?: number } = {}
): Promise<ArkhamApiResponse> => {
    
    return new Promise(resolve => {
        setTimeout(() => {
            // Generate and cache data if it doesn't exist for this address
            if (!mockDataCache[baseAddress]) {
                mockDataCache[baseAddress] = Array.from(
                    { length: SIMULATED_TOTAL_COUNT }, 
                    (_, i) => generateMockTransfer(baseAddress, i)
                );
            }

            const allTransfers = mockDataCache[baseAddress];
            const { offset = 0, limit = 16 } = options;
            
            const paginatedTransfers = allTransfers.slice(offset, offset + limit);

            resolve({
                transfers: paginatedTransfers,
                count: SIMULATED_TOTAL_COUNT,
            });

        }, rand(30, 80)); // Simulate network delay
    });
};
