
import { AxiomWalletTags } from '../types';
import { fetchWalletTags } from "./axiom";

export const fetchTagsForAddress = async (address: string): Promise<AxiomWalletTags | null> => {
    try {
        const results = await fetchWalletTags([address]);
        if (results && results.length > 0) {
            return results[0];
        }
        return null;
    } catch (error) {
        console.error(`Error fetching tags for address ${address}:`, error);
        throw error; // Re-throw to be handled by the caller's catch block
    }
};
