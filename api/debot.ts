
import { PnlData } from '../types';

// This interface represents the structure of the `data` object from the debot.ai API
interface DebotData {
    address: string;
    balance: number;
    pnl_7d: number;
    pnl_30d: number;
    realized_profit_7d: number;
    realized_profit_30d: number;
    winrate_7d: number;
    winrate_30d: number;
    buy_times_7d: number;
    sell_times_7d: number;
    buy_times_30d: number;
    sell_times_30d: number;
    buy_volume_7d: number;
    sell_volume_7d: number;
    buy_volume_30d: number;
    sell_volume_30d: number;
    pnl_lt_minus_dot5_num: number;
    pnl_minus_dot5_0x_num: number;
    pnl_lt_2x_num: number;
    pnl_2x_5x_num: number;
    pnl_gt_5x_num: number;
    token_num: number;
    total_profit: number; // This seems to be lifetime realized profit
    unrealized_profit: number;
    last_active_timestamp: number;
}

interface DebotApiResponse {
    code: number;
    description: string;
    data: DebotData;
}

/**
 * Maps the response from the debot.ai API to our internal PnlData structure.
 * This acts as an adapter, allowing us to change data sources without rewriting UI components.
 * @param debotData The raw data object from the debot.ai API.
 * @returns A partial PnlData object containing the mapped fields.
 */
const mapDebotDataToPnlData = (debotData: DebotData): Partial<PnlData> => {
    return {
        pnl_7d: debotData.pnl_7d,
        pnl_30d: debotData.pnl_30d,
        realized_profit: debotData.total_profit, // Mapping total_profit to our main realized_profit
        realized_profit_7d: debotData.realized_profit_7d,
        realized_profit_30d: debotData.realized_profit_30d,
        unrealized_profit: debotData.unrealized_profit,
        winrate: debotData.winrate_7d, // Using 7D winrate as the primary
        buy_7d: debotData.buy_times_7d,
        sell_7d: debotData.sell_times_7d,
        buy_30d: debotData.buy_times_30d,
        sell_30d: debotData.sell_times_30d,
        total_volume: debotData.buy_volume_30d + debotData.sell_volume_30d, // Summing 30D volumes for total
        pnl_lt_minus_dot5_num: debotData.pnl_lt_minus_dot5_num,
        pnl_minus_dot5_0x_num: debotData.pnl_minus_dot5_0x_num,
        pnl_lt_2x_num: debotData.pnl_lt_2x_num,
        pnl_2x_5x_num: debotData.pnl_2x_5x_num,
        pnl_gt_5x_num: debotData.pnl_gt_5x_num,
        token_num: debotData.token_num,
        last_active_timestamp: debotData.last_active_timestamp,
        balance: debotData.balance.toString(),
    };
};

export const fetchDebotStats = async (address: string, chain: string = 'bsc'): Promise<Partial<PnlData>> => {
    // Use the Vite proxy path to avoid CORS issues during development.
    const params = new URLSearchParams({
        chain: chain,
        wallet: address,
        duration: '7D',
    });
    
    const API_URL = `/api/debot_proxy/api/dashboard/wallet/market/stats?${params.toString()}`;

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`debot.ai API request failed with status ${response.status}: ${errorBody}`);
        }

        const result: DebotApiResponse = await response.json();
        
        if (result.code !== 0) {
            throw new Error(`debot.ai API returned an error: ${result.description}`);
        }

        return mapDebotDataToPnlData(result.data);
    } catch (error) {
        console.error("Error fetching wallet stats from debot.ai API:", error);
        throw error;
    }
};
