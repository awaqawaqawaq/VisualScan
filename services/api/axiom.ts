export interface AxiomApiTag {
    tagName: string;
    category: number;
    count: number;
}

interface AxiomWalletTags {
    address: string;
    count: number;
    tags: AxiomApiTag[];
}

interface AxiomApiResponse {
    reqId: string;
    code: number;
    data: {
        chain: string;
        walletTags: AxiomWalletTags[];
    };
    msg: string;
}

const API_URL = "https://plugin.chaininsight.vip/api/v0/util/query/wallet_tags_v2";

export const fetchWalletTags = async (walletAddresses: string[], chain: string = "bsc"): Promise<AxiomWalletTags[]> => {
    try {
        const headers = {
            "accept": "*/*",
            "content-type": "application/json",
        };

        const json_data = {
            walletAddresses,
            chain,
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(json_data),
        });

        if (!response.ok) {
            throw new Error(`Axiom API request failed with status ${response.status}`);
        }

        const result: AxiomApiResponse = await response.json();

        if (result.code !== 0) {
            throw new Error(`Axiom API returned an error: ${result.msg}`);
        }

        return result.data.walletTags;
    } catch (error) {
        console.error("Error fetching wallet tags from Axiom API:", error);
        // In case of an error, return an empty array to prevent app crash
        return [];
    }
};
