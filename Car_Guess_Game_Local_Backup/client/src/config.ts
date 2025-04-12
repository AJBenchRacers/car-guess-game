export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://car-guess-game-server.onrender.com'  // We'll update this URL after deploying the backend
  : 'http://localhost:3000'; 