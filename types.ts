

export interface Tag {
  id: string;
  text: string;
  asset?: string;
  category: 'Behavior' | 'Identity' | 'Asset' | 'Warning' | 'General';
  upvotes: number;
  downvotes: number;
  submittedBy: string;
  upvoted: boolean;
  downvoted: boolean;
  isOfficial?: boolean;
  voters?: string[];
  voteHistory?: { date: string, count: number }[];
}

export interface RiskData {
    token_active: number;
    token_honeypot: number;
    token_honeypot_ratio: number;
    no_buy_hold: number;
    no_buy_hold_ratio: number;
    sell_pass_buy: number;
    sell_pass_buy_ratio: number;
    fast_tx: number;
    fast_tx_ratio: number;
}

export interface AxiomApiTag {
    tagName: string;
    category: number;
    count: number;
}

export interface AxiomWalletTags {
    address: string;
    count: number;
    tags: AxiomApiTag[];
}

interface ArkhamEntity {
    name: string;
    id: string;
    type: string;
    website?: string;
    twitter?: string;
}

interface ArkhamLabel {
    name: string;
    address: string;
    chainType: string;
}

interface ArkhamAddressInfo {
    address: string;
    chain: string;
    arkhamEntity?: ArkhamEntity;
    arkhamLabel?: ArkhamLabel;
}

export interface ArkhamTransfer {
    id: string;
    blockTimestamp: string;
    blockNumber: number;
    transactionHash: string;
    fromAddress: ArkhamAddressInfo;
    toAddress: ArkhamAddressInfo;
    tokenAddress: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimals: number;
    historicalUSD: number;
    chain: string;
}

export interface ArkhamApiResponse {
    transfers: ArkhamTransfer[];
    count: number;
}

interface ExpertInfo {
    kolId: number;
    name: string;
    avatar: string;
    twitter: string;
}

interface ExpertTag {
    tagName: string;
    expertInfo: ExpertInfo;
}


// Represents the `data` object from the API
export interface PnlData {
    buy: number;
    buy_1d: number;
    buy_7d: number;
    buy_30d: number;
    sell: number;
    sell_1d: number;
    sell_7d: number;
    sell_30d: number;
    pnl: number;
    pnl_1d: number;
    pnl_7d: number;
    pnl_30d: number;
    all_pnl: number;
    realized_profit: number;
    realized_profit_1d: number;
    realized_profit_7d: number;
    realized_profit_30d: number;
    unrealized_profit: number;
    unrealized_pnl: number;
    total_profit: number;
    total_profit_pnl: number;
    balance: string;
    eth_balance: string;
    sol_balance: string;
    trx_balance: string;
    bnb_balance: string;
    total_value: number;
    winrate: number;
    token_sold_avg_profit: number;
    history_bought_cost: number;
    token_avg_cost: number;
    token_num: number;
    profit_num: number;
    pnl_lt_minus_dot5_num: number;
    pnl_minus_dot5_0x_num: number;
    pnl_lt_2x_num: number;
    pnl_2x_5x_num: number;
    pnl_gt_5x_num: number;
    gas_cost: number;
    bind: boolean;
    avatar: string;
    name: string;
    ens: string;
    tags: string[];
    tag_rank: Record<string, number>;
    twitter_name: string;
    twitter_username: string;
    twitter_bind: boolean;
    twitter_fans_num: number | 'N/A';
    followers_count: number;
    is_contract: boolean;
    last_active_timestamp: number;
    risk: RiskData;
    avg_holding_peroid: number;
    updated_at: number;
    refresh_requested_at: number | null;
    follow_count: number;
    remark_count: number;
    total_volume: number;
    creator_created_count: number;
    // Fields from old model, might not be in new data
    protocols?: string[];
    firstTx?: string;
    // Enriched data
    expertTags?: ExpertTag[];
    arkhamTransfers?: ArkhamTransfer[];
}

// The main data structure for an address in the app
export interface AddressData {
  id: string;
  address: string;
  pnlData: PnlData;
  communityTags: Tag[]; 
}


export enum SortKey {
  INFLUENCE = 'influence',
  PROFIT = 'profit',
  VOLUME = 'volume',
  LAST_ACTIVE = 'lastActive',
  WIN_RATE = 'winRate'
}

export enum SortDirection {
    ASC = 'asc',
    DESC = 'desc'
}