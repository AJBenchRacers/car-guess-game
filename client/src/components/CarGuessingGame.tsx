import React, { useState, useEffect, useRef } from 'react';
import { SimilarityValue, CarSimilarities, CarDetails, GuessFeedback } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

interface Guess {
  model: string;
}

const MAX_GUESSES = 8;

const CarGuessingGame: React.FC = () => {
  const [guess, setGuess] = useState({ model: '' });
  const [guessHistory, setGuessHistory] = useState<{ model: string; feedback: GuessFeedback }[]>([]);
  const [guessCount, setGuessCount] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const gameID = Math.floor(Math.random() * 1000);

  useEffect(() => {
    checkGameState();

    // Add click outside listener for suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Reset and ensure proper scrolling behavior
    document.documentElement.style.height = 'auto';
    document.documentElement.style.overflow = 'visible';
    document.documentElement.style.overflowX = 'hidden';
    
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100vh';
    document.body.style.overflowY = 'scroll';
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const checkGameState = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/game-state`);
      if (!response.ok) {
        throw new Error('Failed to check game state');
      }
      const data = await response.json();
      setGameReady(data.hasGame);
    } catch (error) {
      console.error('Error checking game state:', error);
      setError('Failed to connect to the game server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGuess({ model: value });
    
    if (value.length >= 1) {
      setIsSearching(true);
      try {
        const response = await fetch(`${API_BASE_URL}/search/models?query=${encodeURIComponent(value)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setGuess({ model: suggestion });
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputFocus = () => {
    if (guess.model.length >= 1 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleGuess = async () => {
    if (guessCount >= MAX_GUESSES) {
      alert('You have used all your guesses for today!');
      return;
    }

    if (!guess.model.trim()) {
      alert('Please enter a car model');
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowSuggestions(false);
    try {
      const response = await fetch(`${API_BASE_URL}/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: guess.model.trim()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit guess');
      }
      
      const data = await response.json();
      console.log('Feedback received:', data);
      
      setGuessHistory(prev => [...prev, { model: guess.model, feedback: data }]);
      setGuessCount(prev => prev + 1);
      
      if (data.isCorrect) {
        setIsCorrect(true);
      }
      
      // Clear input field after guess
      setGuess({ model: '' });
      setSuggestions([]);
    } catch (error) {
      console.error('Error submitting guess:', error);
      setError('Failed to submit guess. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGuess();
    } else if (e.key === 'ArrowDown' && showSuggestions && suggestions.length > 0) {
      if (suggestionRef.current) {
        const firstSuggestion = suggestionRef.current.querySelector('div');
        if (firstSuggestion) {
          (firstSuggestion as HTMLDivElement).focus();
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, suggestion: string) => {
    if (e.key === 'Enter') {
      handleSuggestionClick(suggestion);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
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

  if (isLoading && guessHistory.length === 0) {
    return (
      <div className="min-h-screen bg-[#121623] flex items-center justify-center">
        <div className="text-2xl font-semibold text-blue-400">Loading...</div>
      </div>
    );
  }

  if (error && guessHistory.length === 0) {
    return (
      <div className="min-h-screen bg-[#121623] flex items-center justify-center">
        <div className="text-xl font-semibold text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-wheeldle-dark text-white w-full">
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-20">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-extrabold tracking-wide mb-4">WHEELDLE</h1>
          <p className="text-gray-300 text-lg font-semibold">
            GUESSES: <span className="text-white font-bold">{guessCount}</span>
          </p>
        </div>
        
        {/* Input */}
        <div className="mb-12 max-w-xl mx-auto">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={guess.model}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              className="w-full p-4 text-lg bg-wheeldle-card border-none rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              placeholder="type a car model"
              disabled={isLoading || guessCount >= MAX_GUESSES || isCorrect}
              autoComplete="off"
            />
          
            {showSuggestions && (
              <div 
                ref={suggestionRef}
                className="absolute top-full left-0 right-0 mt-1 bg-wheeldle-dark rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto border border-gray-700"
                style={{ backgroundColor: '#1e2130' }}
              >
                {isSearching ? (
                  <div className="p-3 text-center text-gray-400 text-lg">Loading...</div>
                ) : (
                  suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onKeyDown={(e) => handleSuggestionKeyDown(e, suggestion)}
                      tabIndex={0}
                      className="p-3 hover:bg-wheeldle-hover cursor-pointer focus:bg-wheeldle-hover focus:outline-none border-b border-gray-700 last:border-b-0 text-lg font-medium"
                    >
                      {suggestion}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Guesses */}
        {guessHistory.length > 0 && (
          <div className="space-y-4 mb-6">
            {guessHistory.map((historyItem, index) => (
              <div key={index} className="bg-wheeldle-card rounded-lg p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="font-bold text-lg">
                    <span className="text-gray-400 mr-2">#{index + 1}</span>
                    <span>{historyItem.model}</span>
                  </div>
                  {historyItem.feedback.isCorrect && (
                    <span className="bg-green-900 text-green-300 text-sm px-3 py-1 rounded-full font-bold">
                      Correct!
                    </span>
                  )}
                </div>
                
                {historyItem.feedback.similarities && (
                  <div className="w-full px-2">
                    <div className="grid grid-cols-6 gap-2">
                      <div className="flex flex-col items-center">
                        <div className="text-sm text-gray-300 mb-2 text-center font-bold">Brand</div>
                        <div 
                          className={`w-full h-12 flex items-center justify-center rounded-lg px-2 font-semibold text-base`}
                          style={{
                            backgroundColor: historyItem.feedback.similarities?.brand?.isMatch 
                              ? '#bae6b0' 
                              : historyItem.feedback.similarities?.brand?.value 
                                ? '#ef4444aa' 
                                : '#def2e5',
                            color: historyItem.feedback.similarities?.brand?.isMatch 
                              ? '#065f46' 
                              : historyItem.feedback.similarities?.brand?.value 
                                ? 'white' 
                                : '#1f2937',
                            position: 'relative',
                            zIndex: 10
                          }}
                        >
                          {historyItem.feedback.similarities?.brand?.value || 'Unknown'}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="text-sm text-gray-300 mb-2 text-center font-bold">Year</div>
                        <div 
                          className={`w-full h-12 flex items-center justify-center rounded-lg px-2 font-semibold text-base`}
                          style={{
                            backgroundColor: historyItem.feedback.similarities?.production_from_year?.isMatch 
                              ? '#bae6b0' 
                              : historyItem.feedback.similarities?.production_from_year?.isClose 
                                ? '#fde68a' 
                                : historyItem.feedback.similarities?.production_from_year?.value !== undefined 
                                  ? '#ef4444aa' 
                                  : '#def2e5',
                            color: historyItem.feedback.similarities?.production_from_year?.isMatch 
                              ? '#065f46' 
                              : historyItem.feedback.similarities?.production_from_year?.isClose 
                                ? '#92400e' 
                                : historyItem.feedback.similarities?.production_from_year?.value !== undefined 
                                  ? 'white' 
                                  : '#1f2937',
                            position: 'relative',
                            zIndex: 10
                          }}
                        >
                          <span>
                            {historyItem.feedback.similarities?.production_from_year?.value || 'Unknown'}
                            {!historyItem.feedback.similarities?.production_from_year?.isMatch && 
                            historyItem.feedback.similarities?.production_from_year?.direction && (
                              <span className="ml-1 font-bold">
                                {historyItem.feedback.similarities?.production_from_year.direction === 'higher' ? '↑' : '↓'}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="text-sm text-gray-300 mb-2 text-center font-bold">Class</div>
                        <div 
                          className={`w-full h-12 flex items-center justify-center rounded-lg px-2 font-semibold text-base`}
                          style={{
                            backgroundColor: historyItem.feedback.similarities?.segment?.isMatch 
                              ? '#bae6b0' 
                              : historyItem.feedback.similarities?.segment?.value 
                                ? '#ef4444aa' 
                                : '#def2e5',
                            color: historyItem.feedback.similarities?.segment?.isMatch 
                              ? '#065f46' 
                              : historyItem.feedback.similarities?.segment?.value 
                                ? 'white' 
                                : '#1f2937',
                            position: 'relative',
                            zIndex: 10
                          }}
                        >
                          {historyItem.feedback.similarities?.segment?.value || 'Unknown'}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="text-sm text-gray-300 mb-2 text-center font-bold">Cylinders</div>
                        <div 
                          className={`w-full h-12 flex items-center justify-center rounded-lg px-2 font-semibold text-base`}
                          style={{
                            backgroundColor: historyItem.feedback.similarities?.cylinders?.isMatch 
                              ? '#bae6b0' 
                              : historyItem.feedback.similarities?.cylinders?.isClose 
                                ? '#fde68a' 
                                : historyItem.feedback.similarities?.cylinders?.value !== undefined 
                                  ? '#ef4444aa' 
                                  : '#def2e5',
                            color: historyItem.feedback.similarities?.cylinders?.isMatch 
                              ? '#065f46' 
                              : historyItem.feedback.similarities?.cylinders?.isClose 
                                ? '#92400e' 
                                : historyItem.feedback.similarities?.cylinders?.value !== undefined 
                                  ? 'white' 
                                  : '#1f2937',
                            position: 'relative',
                            zIndex: 10
                          }}
                        >
                          <span>
                            {historyItem.feedback.similarities?.cylinders?.value || 'Unknown'}
                            {!historyItem.feedback.similarities?.cylinders?.isMatch && 
                            historyItem.feedback.similarities?.cylinders?.direction && (
                              <span className="ml-1 font-bold">
                                {historyItem.feedback.similarities?.cylinders?.direction === 'higher' ? '↑' : '↓'}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="text-sm text-gray-300 mb-2 text-center font-bold">Engine (cc)</div>
                        <div 
                          className={`w-full h-12 flex items-center justify-center rounded-lg px-2 font-semibold text-base`}
                          style={{
                            backgroundColor: historyItem.feedback.similarities?.displacement?.isMatch 
                              ? '#bae6b0' 
                              : historyItem.feedback.similarities?.displacement?.isClose 
                                ? '#fde68a' 
                                : historyItem.feedback.similarities?.displacement?.value !== undefined 
                                  ? '#ef4444aa' 
                                  : '#def2e5',
                            color: historyItem.feedback.similarities?.displacement?.isMatch 
                              ? '#065f46' 
                              : historyItem.feedback.similarities?.displacement?.isClose 
                                ? '#92400e' 
                                : historyItem.feedback.similarities?.displacement?.value !== undefined 
                                  ? 'white' 
                                  : '#1f2937',
                            position: 'relative',
                            zIndex: 10
                          }}
                        >
                          <span>
                            {historyItem.feedback.similarities?.displacement?.value || 'Unknown'}
                            {!historyItem.feedback.similarities?.displacement?.isMatch && 
                            historyItem.feedback.similarities?.displacement?.direction && (
                              <span className="ml-1 font-bold">
                                {historyItem.feedback.similarities?.displacement?.direction === 'higher' ? '↑' : '↓'}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="text-sm text-gray-300 mb-2 text-center font-bold">Drivetrain</div>
                        <div 
                          className={`w-full h-12 flex items-center justify-center rounded-lg px-2 font-semibold text-base`}
                          style={{
                            backgroundColor: historyItem.feedback.similarities?.drive_type?.isMatch 
                              ? '#bae6b0' 
                              : historyItem.feedback.similarities?.drive_type?.value 
                                ? '#ef4444aa' 
                                : '#def2e5',
                            color: historyItem.feedback.similarities?.drive_type?.isMatch 
                              ? '#065f46' 
                              : historyItem.feedback.similarities?.drive_type?.value 
                                ? 'white' 
                                : '#1f2937',
                            position: 'relative',
                            zIndex: 10
                          }}
                        >
                          {historyItem.feedback.similarities?.drive_type?.value || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {historyItem.feedback.message && !historyItem.feedback.similarities && (
                  <p className="text-gray-300 font-medium text-lg">{historyItem.feedback.message}</p>
                )}

                {historyItem.feedback.isCorrect && historyItem.feedback.carDetails && (
                  <div className="mt-5 p-5 bg-wheeldle-hover rounded-lg">
                    <h3 className="text-lg font-bold mb-3 text-center">Car Details:</h3>
                    <div className="grid grid-cols-3 gap-3 text-sm text-center">
                      <div className="col-span-3 mb-3">
                        <h4 className="text-base font-bold text-green-300">{historyItem.feedback.carDetails.brand} {historyItem.feedback.carDetails.model}</h4>
                      </div>
                      
                      <div className="p-2">
                        <p className="text-gray-300 font-bold">Brand</p>
                        <p className="text-white font-semibold">{historyItem.feedback.carDetails.brand}</p>
                      </div>
                      <div className="p-2">
                        <p className="text-gray-300 font-bold">Year</p>
                        <p className="text-white font-semibold">{historyItem.feedback.carDetails.production_from_year}</p>
                      </div>
                      <div className="p-2">
                        <p className="text-gray-300 font-bold">Class</p>
                        <p className="text-white font-semibold">{historyItem.feedback.carDetails.segment}</p>
                      </div>
                      <div className="p-2">
                        <p className="text-gray-300 font-bold">Cylinders</p>
                        <p className="text-white font-semibold">{historyItem.feedback.carDetails.cylinders || 'N/A'}</p>
                      </div>
                      <div className="p-2">
                        <p className="text-gray-300 font-bold">Engine Size</p>
                        <p className="text-white font-semibold">{historyItem.feedback.carDetails.displacement ? `${historyItem.feedback.carDetails.displacement}cc` : 'N/A'}</p>
                      </div>
                      <div className="p-2">
                        <p className="text-gray-300 font-bold">Drivetrain</p>
                        <p className="text-white font-semibold">{historyItem.feedback.carDetails.drive_type || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to Play Section */}
      <div className="mt-6">
        <button 
          onClick={toggleHowToPlay}
          className="flex items-center w-full bg-wheeldle-card p-4 rounded-lg hover:bg-wheeldle-hover transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
          <span className="font-bold text-lg">How to play</span>
        </button>
        
        {showHowToPlay && (
          <div className="mt-2 p-5 bg-wheeldle-card rounded-lg text-gray-200 text-base">
            <p className="mb-3 font-medium">Find the secret car model. You have {MAX_GUESSES} guesses.</p>
            <p className="mb-3 font-medium">The attributes were sorted based on their similarity to the secret car:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2 font-medium">
              <li><span className="bg-green-100 border-green-300 text-green-800 px-3 py-1 rounded-lg font-bold">Green</span> - Exact match</li>
              <li><span className="bg-yellow-100 border-yellow-300 text-yellow-800 px-3 py-1 rounded-lg font-bold">Yellow</span> - Close match</li>
              <li><span className="bg-gray-100 border-gray-300 text-gray-800 px-3 py-1 rounded-lg font-bold">Gray</span> - Not a match</li>
            </ul>
            <p className="font-medium">After submitting a guess, you will see how each attribute compares to the secret car.</p>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="mt-6">
        <button 
          onClick={toggleFAQ}
          className="flex items-center w-full bg-wheeldle-card p-4 rounded-lg hover:bg-wheeldle-hover transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
          <span className="font-bold text-lg">FAQ</span>
        </button>
        
        {showFAQ && (
          <div className="mt-2 p-5 bg-wheeldle-card rounded-lg text-gray-200 text-base">
            <div className="mb-5">
              <h3 className="font-bold mb-2 flex items-center text-lg">
                <span>What cars are included?</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 ml-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </h3>
              <p className="font-medium">The game includes a wide variety of car models from different manufacturers and years.</p>
            </div>
            <div>
              <h3 className="font-bold mb-2 flex items-center text-lg">
                <span>How are attributes compared?</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 ml-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </h3>
              <p className="font-medium">For numerical values like year, displacement, or cylinders, close values will be highlighted in yellow. For categorical values like brand, segment, or drive type, only exact matches are highlighted in green.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarGuessingGame; 