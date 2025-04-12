import React, { useState, useEffect } from 'react';
import { GuessFeedback } from '../types';
import { API_URL } from '../config';

interface SearchResult {
  display: string;
  model: string;
}

// Simplified version without unused variables
const CarGuessingGame: React.FC = () => {
  const [guess, setGuess] = useState({ model: '' });
  const [guessHistory, setGuessHistory] = useState<{ model: string; feedback: GuessFeedback; guessNumber?: number }[]>([]);
  const [guessCount, setGuessCount] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_gameReady, setGameReady] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    // Check game state on component mount
    checkGameState();
  }, []);

  const checkGameState = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/game-state`);
      if (!response.ok) throw new Error('Failed to check game state');
      const data = await response.json();
      setGameReady(data.hasGame);
    } catch (err) {
      console.error('Error checking game state:', err);
      setError('Failed to connect to the game server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuess = async () => {
    if (!guess.model.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: guess.model.trim() }),
      });
      
      if (!response.ok) throw new Error('Failed to submit guess');
      
      const data = await response.json();
      setGuessHistory(prev => [{
        model: guess.model,
        feedback: data,
        guessNumber: guessCount + 1
      }, ...prev]);
      
      setGuessCount(prev => prev + 1);
      if (data.isCorrect) setIsCorrect(true);
      
    } catch (err) {
      console.error('Error submitting guess:', err);
      setError('Failed to submit guess');
    } finally {
      setIsLoading(false);
      setGuess({ model: '' });
    }
  };

  const toggleHowToPlay = () => {
    setShowHowToPlay(!showHowToPlay);
    if (showFAQ) setShowFAQ(false);
  };

  const toggleFAQ = () => {
    setShowFAQ(!showFAQ);
    if (showHowToPlay) setShowHowToPlay(false);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4">
      <h1 className="text-3xl font-bold text-center mb-4">Car Guessing Game</h1>
      
      {isLoading && guessHistory.length === 0 ? (
        <div className="text-center">Loading...</div>
      ) : error && guessHistory.length === 0 ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <>
          <div className="max-w-md mx-auto mb-6">
            <input
              type="text"
              value={guess.model}
              onChange={(e) => setGuess({ model: e.target.value })}
              className="w-full p-2 rounded bg-gray-800 text-white"
              placeholder="Enter car model"
              disabled={isLoading || isCorrect}
            />
            <button 
              onClick={handleGuess}
              disabled={isLoading || isCorrect || !guess.model.trim()}
              className="w-full mt-2 p-2 bg-blue-600 rounded disabled:bg-gray-600"
            >
              Guess
            </button>
          </div>

          {guessHistory.length > 0 && (
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-2">Guesses: {guessCount}</h2>
              <div className="space-y-4">
                {guessHistory.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded">
                    <p><span className="text-gray-400">#{item.guessNumber}</span> {item.model}</p>
                    {item.feedback.isCorrect && (
                      <p className="text-green-500 font-bold">Correct!</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-4">
            <button onClick={toggleHowToPlay} className="p-2 bg-gray-800 rounded">
              How to Play
            </button>
            <button onClick={toggleFAQ} className="p-2 bg-gray-800 rounded">
              FAQ
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CarGuessingGame; 