import axios from 'axios';

const FPL_API_BASE_URL = 'https://fantasy.premierleague.com/api';

export interface LeagueInfo {
  league: {
    id: number;
    name: string;
    created: string;
    closed: boolean;
  };
  standings: {
    has_next: boolean;
    page: number;
    results: LeagueEntry[];
  };
}

export interface LeagueEntry {
  entry: number;
  entry_name: string;
  player_name: string;
  rank: number;
  last_rank: number;
  total: number;
  entry_history: {
    points: number;
    total_points: number;
    rank: number;
    rank_sort: number;
    overall_rank: number;
    bank: number;
    value: number;
    event_transfers: number;
    event_transfers_cost: number;
    points_on_bench: number;
  };
}

export interface ManagerHistory {
  current: GameweekHistory[];
  chips: ChipPlay[];
  past: PastSeason[];
}

interface GameweekHistory {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  overall_rank: number;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

interface ChipPlay {
  name: string;
  event: number;
  time: string;
}

interface PastSeason {
  season_name: string;
  total_points: number;
  rank: number;
}

export const fetchLeagueInfo = async (leagueId: string): Promise<LeagueInfo> => {
  try {
    const response = await axios.get(
      `${FPL_API_BASE_URL}/leagues-classic/${leagueId}/standings/`
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch league information');
  }
};

export const fetchManagerHistory = async (managerId: number): Promise<ManagerHistory> => {
  try {
    const response = await axios.get(
      `${FPL_API_BASE_URL}/entry/${managerId}/history/`
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch manager history');
  }
};

export const fetchManagerInfo = async (managerId: number) => {
  try {
    const response = await axios.get(
      `${FPL_API_BASE_URL}/entry/${managerId}/`
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch manager information');
  }
}; 