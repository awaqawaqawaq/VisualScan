
import { ArkhamApiResponse } from '../types';
import { fetchMockArkhamTransfers } from './mockApi';

export const fetchArkhamTransfers = async (baseAddress: string, options: { offset?: number, limit?: number } = {}): Promise<ArkhamApiResponse> => {
    // --- START: MOCK IMPLEMENTATION FOR UI TESTING ---
    // This will return consistent, randomly generated data for development.
    // To switch to the live API, comment out the line below and uncomment the "REAL API" block.
    // return fetchMockArkhamTransfers(baseAddress, options);
    // --- END: MOCK IMPLEMENTATION ---


    
    // --- START: REAL API IMPLEMENTATION ---
    // Point to the new, non-conflicting local proxy path.
    const API_URL = "/api/arkham_proxy/transfers";

    // Headers no longer need the hardcoded cookie. The proxy will handle forwarding it.
    const headers = {
        'accept': 'application/json, text/plain, *',
        'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh-HK;q=0.7,zh;q=0.6',
        'cache-control': 'no-cache',
    };
    
    const { offset = 0, limit = 20 } = options;
    
    const params = new URLSearchParams({
        'usdGte': '0.1',
        'sortKey': 'time',
        'sortDir': 'desc',
        'limit': limit.toString(),
        'offset': offset.toString(),
        'flow': 'all',
        'base': baseAddress,
    });

    try {
        const response = await fetch(`${API_URL}?${params.toString()}`, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Arkham API request failed with status ${response.status}: ${errorBody}`);
        }

        const result: ArkhamApiResponse = await response.json();
        return result;
    } catch (error) {
        console.error("Error fetching transfers from Arkham API:", error);
        // Re-throw the error to be handled by the calling component
        throw error;
    }
    // --- END: REAL API IMPLEMENTATION ---
    
};
