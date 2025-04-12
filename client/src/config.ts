// Base API URL
export const API_URL = process.env.NODE_ENV === 'production'
  ? import.meta.env.VITE_API_URL || 'https://cartexto-be.vercel.app'
  : 'http://localhost:3000';

// API endpoints
export const ENDPOINTS = {
  GAME_STATE: `${API_URL}/api/game-state`,
  SEARCH: `${API_URL}/api/search/models`,
  GUESS: `${API_URL}/api/guess`
};

// API configuration
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json'
  }
}; 