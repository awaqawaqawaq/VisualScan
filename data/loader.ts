





import { AddressData, PnlData, AxiomApiTag, Tag } from '../types';
import tagsData from './tags.js';
import { mapOfficialTag } from '../utils/tags';

// Helper to generate a random number within a range
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

// Function to generate a full PnlData object with random but plausible values
const generatePnlDataForAddress = (address: string): PnlData => {
  const realized_profit = rand(-50000, 200000);
  const total_volume = rand(100000, 50000000);
  const winrate = rand(0.4, 0.95);
  const followers_count = Math.floor(rand(100, 50000));
  
  return {
    buy: rand(10000, 500000),
    buy_1d: rand(1000, 50000),
    buy_7d: rand(5000, 200000),
    buy_30d: rand(10000, 500000),
    sell: rand(10000, 500000),
    sell_1d: rand(1000, 50000),
    sell_7d: rand(5000, 200000),
    sell_30d: rand(10000, 500000),
    pnl: rand(-0.1, 0.5),
    pnl_1d: rand(-0.05, 0.05),
    pnl_7d: rand(-0.1, 0.2),
    pnl_30d: rand(-0.1, 0.5),
    all_pnl: rand(-0.1, 0.5),
    realized_profit: realized_profit,
    realized_profit_1d: realized_profit * rand(-0.1, 0.1),
    realized_profit_7d: realized_profit * rand(0.1, 0.5),
    realized_profit_30d: realized_profit * rand(0.2, 1),
    unrealized_profit: rand(-10000, 10000),
    unrealized_pnl: rand(-0.01, 0.01),
    total_profit: realized_profit + rand(-5000, 5000),
    total_profit_pnl: winrate * rand(0.01, 0.05),
    balance: rand(1, 100).toFixed(4),
    eth_balance: rand(1, 100).toFixed(4),
    sol_balance: rand(0, 50).toFixed(4),
    trx_balance: rand(0, 1000).toFixed(4),
    bnb_balance: rand(0, 20).toFixed(4),
    total_value: rand(1000, 100000),
    winrate: winrate,
    token_sold_avg_profit: rand(-100, 1000),
    history_bought_cost: rand(100000, 10000000),
    token_avg_cost: rand(100, 50000),
    token_num: Math.floor(rand(10, 500)),
    profit_num: Math.floor(winrate * rand(10, 500)),
    pnl_lt_minus_dot5_num: Math.floor(rand(0, 50)),
    pnl_minus_dot5_0x_num: Math.floor(rand(10, 150)),
    pnl_lt_2x_num: Math.floor(rand(20, 300)),
    pnl_2x_5x_num: Math.floor(rand(0, 20)),
    pnl_gt_5x_num: Math.floor(rand(0, 10)),
    gas_cost: rand(10, 1000),
    bind: Math.random() > 0.5,
    avatar: `https://picsum.photos/seed/${address}/64/64`,
    name: "",
    ens: "",
    tags: [], // Official tags are empty, we use axiomTags
    tag_rank: {},
    twitter_name: "N/A",
    twitter_username: "N/A",
    twitter_bind: false,
    twitter_fans_num: followers_count,
    followers_count: followers_count,
    is_contract: address === '0x0000000000000000000000000000000000000dead',
    last_active_timestamp: Math.floor(Date.now() / 1000) - Math.floor(rand(3600, 86400 * 30)), // Active in last 30 days
    risk: {
      token_active: Math.floor(rand(10, 500)),
      token_honeypot: Math.floor(rand(0, 5)),
      token_honeypot_ratio: rand(0, 0.05),
      no_buy_hold: Math.floor(rand(0, 10)),
      no_buy_hold_ratio: rand(0, 0.1),
      sell_pass_buy: Math.floor(rand(0, 5)),
      sell_pass_buy_ratio: rand(0, 0.05),
      fast_tx: Math.floor(rand(10, 400)),
      fast_tx_ratio: rand(0.2, 0.98),
    },
    avg_holding_peroid: rand(3600, 86400 * 7), // 1 hour to 7 days
    updated_at: Math.floor(Date.now() / 1000),
    refresh_requested_at: null,
    follow_count: Math.floor(rand(0, 100)),
    remark_count: Math.floor(rand(0, 50)),
    total_volume: total_volume,
    creator_created_count: 0,
    arkhamTransfers: [], // No mock Arkham data for now
  };
};

export const createAddressDataFromApiTags = (address: string, apiTags: AxiomApiTag[]): AddressData => {
    const pnlData = generatePnlDataForAddress(address);
    // PNL tags from other sources would go here; Axiom tags are community-driven.
    pnlData.tags = [];

    const communityTags: Tag[] = apiTags.map(apiTag => {
        const mappedTag = mapOfficialTag(apiTag.tagName);
        return {
          ...mappedTag,
          id: `found-ct-${address}-${apiTag.tagName}`,
          upvotes: apiTag.count,
          downvotes: 0,
          submittedBy: 'MemeRadar',
          upvoted: false,
          downvoted: false,
          isOfficial: false,
        };
      });

    return {
        id: address, // Use address as a unique ID for dynamically added entries
        address: address,
        pnlData,
        communityTags,
    };
};

const generateMockVoters = (upvotes: number): string[] => {
    const voterCount = Math.min(upvotes, Math.floor(rand(3, 8)));
    const voters = new Set<string>();
    const knownAddresses = tagsData.data.walletTags.map(w => w.address);

    while (voters.size < voterCount) {
        if (Math.random() < 0.7 && knownAddresses.length > voters.size) { // 70% chance to pick a known address
            voters.add(knownAddresses[Math.floor(Math.random() * knownAddresses.length)]);
        } else {
            voters.add(`0x${[...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`);
        }
    }
    return Array.from(voters);
};

const generateVoteHistory = (totalUpvotes: number): { date: string, count: number }[] => {
    const history: { date: string, count: number }[] = [];
    let currentVotes = Math.max(0, totalUpvotes - Math.floor(rand(5, 50)));
    
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        
        currentVotes += rand(0, 3);
        if (currentVotes > totalUpvotes) {
            currentVotes = totalUpvotes;
        }

        history.push({
            date: d.toLocaleDateString('en-CA'),
            count: Math.floor(currentVotes),
        });
    }
    // Ensure the last day matches the total upvotes
    if (history.length > 0) {
      history[history.length - 1].count = totalUpvotes;
    }
    return history;
}

const processedAddresses: AddressData[] = tagsData.data.walletTags.map((walletTag, index) => {
  const pnlData = generatePnlDataForAddress(walletTag.address);
  // The raw tag strings from the API are now stored in pnlData.tags.
  // Components will use `mapOfficialTag` to process these for display.
  pnlData.tags = ((walletTag.tags || []) as AxiomApiTag[]).map(t => t.tagName);

  const thirdPartyTags: Tag[] = ((walletTag.tags || []) as AxiomApiTag[]).map(apiTag => {
    const mappedTag = mapOfficialTag(apiTag.tagName);
    return {
      ...mappedTag,
      id: `memeradar-${walletTag.address}-${apiTag.tagName}`,
      upvotes: apiTag.count,
      downvotes: Math.floor(rand(0, apiTag.count / 10)),
      submittedBy: 'MemeRadar',
      upvoted: false,
      downvoted: false,
      isOfficial: false, // These are community-sourced from the API
      voters: generateMockVoters(apiTag.count),
      voteHistory: generateVoteHistory(apiTag.count),
    };
  });
  
  const dummyTags: Tag[] = ([
    { id: `ct-${index}-1`, text: 'Community Insight', category: 'General', upvotes: Math.floor(rand(5, 50)), downvotes: Math.floor(rand(0,10)), submittedBy: '0x1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a', upvoted: false, downvoted: false, asset: undefined },
    { id: `ct-${index}-2`, text: 'Needs Review', category: 'Warning', upvotes: Math.floor(rand(0, 15)), downvotes: Math.floor(rand(0,5)), submittedBy: '0x2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b', upvoted: false, downvoted: false, asset: undefined },
  ] as const).map(tag => ({
      ...tag,
      voters: generateMockVoters(tag.upvotes),
      voteHistory: generateVoteHistory(tag.upvotes),
  }));

  return {
    id: `${index + 1}`,
    address: walletTag.address,
    pnlData,
    communityTags: [...dummyTags, ...thirdPartyTags],
  };
});

// For demonstration, let's inject Vitalik's data from the old mock to keep one well-known address
const vitalikData: AddressData = {
    id: 'vitalik',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    pnlData: {
      buy: 51052, sell: 51066, pnl: 0.00313, all_pnl: 0.0032, realized_profit: 25000000, unrealized_profit: -1.07, total_profit: 24999998.93, total_profit_pnl: 0.0032, balance: "3250.7", eth_balance: "3250.7", sol_balance: "0", trx_balance: "0", bnb_balance: "0", total_value: 9752100, winrate: 0.85, token_sold_avg_profit: 150000, history_bought_cost: 50000000, token_avg_cost: 100000, token_num: 150, profit_num: 127, pnl_lt_minus_dot5_num: 2, pnl_minus_dot5_0x_num: 20, pnl_lt_2x_num: 100, pnl_2x_5x_num: 25, pnl_gt_5x_num: 3, gas_cost: 15000, bind: true,
      avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-h_R_89w2-s95T2o5C5O_M9YgX5lQJ3H2w&s',
      name: 'Vitalik Buterin',
      ens: 'vitalik.eth',
      tags: ['Ethereum Founder', 'OG'],
      tag_rank: { "Ethereum Founder": 0, "OG": 1 },
      twitter_name: 'Vitalik Buterin',
      twitter_username: 'VitalikButerin',
      twitter_bind: true,
      twitter_fans_num: 5000000,
      followers_count: 5000000,
      is_contract: false,
      last_active_timestamp: 1721433600, // July 20 2024
      risk: { token_active: 150, token_honeypot: 0, token_honeypot_ratio: 0, no_buy_hold: 5, no_buy_hold_ratio: 0.03, sell_pass_buy: 1, sell_pass_buy_ratio: 0.006, fast_tx: 10, fast_tx_ratio: 0.06 },
      avg_holding_peroid: 31536000,
      updated_at: 1721989723,
      refresh_requested_at: null,
      follow_count: 1,
      remark_count: 999,
      total_volume: 150000000,
      creator_created_count: 1,
      buy_1d: 0, buy_7d: 10000, buy_30d: 50000, sell_1d: 0, sell_7d: 25000, sell_30d: 100000, pnl_1d: 0, pnl_7d: 0.01, pnl_30d: 0.05, realized_profit_1d: 0, realized_profit_7d: 1000, realized_profit_30d: 5000, unrealized_pnl: 0,
    },
    communityTags: [
        { id: 'ct-vitalik-1', text: 'Public Figure', category: 'Identity', upvotes: 999, downvotes: 10, submittedBy: '0x1ab4973a48dc892cd9971ece8e01dcc7688f8f23', upvoted: false, downvoted: false, voters: generateMockVoters(999), voteHistory: generateVoteHistory(999) },
    ]
}

export const initialAddresses: AddressData[] = [vitalikData, ...processedAddresses];