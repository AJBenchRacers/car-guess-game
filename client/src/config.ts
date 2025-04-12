// Using environment variables for flexible deployment
export const API_URL = 
  process.env.VITE_API_URL || // Preferred way to set API URL in production 
  (process.env.NODE_ENV === 'production' 
    ? 'https://car-guess-game-server.vercel.app'  // Default production URL (replace with your actual Vercel URL)
    : 'http://localhost:3000'); // Development URL 