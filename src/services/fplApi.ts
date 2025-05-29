import axios from 'axios';

const FPL_API_BASE_URL = 'https://fantasy.premierleague.com/api';

// Configure axios defaults
const api = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Origin': 'https://fantasy.premierleague.com',
    'Referer': 'https://fantasy.premierleague.com/',
  },
});

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
    // First try direct API call
    try {
      const response = await api.get(
        `${FPL_API_BASE_URL}/leagues-classic/${leagueId}/standings/`
      );
      return response.data;
    } catch (directError) {
      console.log('Direct API call failed, trying with CORS proxy...');
      // If direct call fails, try with CORS proxy
      const response = await axios.get(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(
          `${FPL_API_BASE_URL}/leagues-classic/${leagueId}/standings/`
        )}`
      );
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching league info:', error);
    throw new Error('Failed to fetch league information. The FPL API might be temporarily unavailable.');
  }
};

export const fetchManagerHistory = async (managerId: number): Promise<ManagerHistory> => {
  try {
    // First try direct API call
    try {
      const response = await api.get(
        `${FPL_API_BASE_URL}/entry/${managerId}/history/`
      );
      return response.data;
    } catch (directError) {
      console.log('Direct API call failed, trying with CORS proxy...');
      // If direct call fails, try with CORS proxy
      const response = await axios.get(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(
          `${FPL_API_BASE_URL}/entry/${managerId}/history/`
        )}`
      );
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching manager history:', error);
    throw new Error('Failed to fetch manager history');
  }
};

export const fetchManagerInfo = async (managerId: number) => {
  try {
    // First try direct API call
    try {
      const response = await api.get(
        `${FPL_API_BASE_URL}/entry/${managerId}/`
      );
      return response.data;
    } catch (directError) {
      console.log('Direct API call failed, trying with CORS proxy...');
      // If direct call fails, try with CORS proxy
      const response = await axios.get(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(
          `${FPL_API_BASE_URL}/entry/${managerId}/`
        )}`
      );
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching manager info:', error);
    throw new Error('Failed to fetch manager information');
  }
}; 