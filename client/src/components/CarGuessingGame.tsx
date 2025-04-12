import React, { useState, useEffect, useRef } from 'react';
import type { SimilarityValue as _SimilarityValue, CarSimilarities as _CarSimilarities, CarDetails as _CarDetails } from '../types';
import { GuessFeedback } from '../types';
import { API_URL } from '../config';

interface _Guess {
  model: string;
  guessNumber?: number;
}

interface SearchResult {
  display: string;
  model: string;
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const [audioMethod, setAudioMethod] = useState<number>(1);
  const victorySound = useRef<HTMLAudioElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const _gameID = Math.floor(Math.random() * 1000);

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
    
    // Initialize audio on mount
    console.log('Testing audio setup...');
    
    // Method 1: Audio API
    try {
      victorySound.current = new Audio('/Lexus LFA V10 Exhaust Revs - Amazing Sound!!-yt.savetube.me-[AudioTrimmer.com].mp3');
      victorySound.current.volume = 0.7;
      console.log('Method 1 setup complete');
    } catch (e) {
      console.error('Method 1 setup failed:', e);
    }

    // Set volume for audio elements
    if (audioElementRef.current) {
      audioElementRef.current.volume = 0.7;
    }

    // Add click event listener to enable audio
    const enableAudio = () => {
      if (victorySound.current) {
        victorySound.current.play().then(() => {
          victorySound.current!.pause();
          victorySound.current!.currentTime = 0;
        }).catch(console.error);
      }
    };
    document.addEventListener('click', enableAudio, { once: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', enableAudio);
      if (victorySound.current) {
        victorySound.current.pause();
        victorySound.current = null;
      }
    };
  }, []);

  const checkGameState = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/game-state`);
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
      setSuggestions([]); // Clear previous suggestions while searching
      try {
        const response = await fetch(`${API_URL}/api/search/models?query=${encodeURIComponent(value)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        const data = await response.json();
        console.log('Search results:', data); // Debug log
        if (Array.isArray(data)) {
          // Process the data to remove redundant brand names
          const processedData = data.map(item => {
            // Split the display string into words
            const words = item.display.split(' ');
            // Get the brand (first word)
            const brand = words[0];
            // Remove the redundant brand name that follows
            const remainingWords = words.slice(1).filter((word: string) => word !== brand.toUpperCase());
            // Join everything back together
            return {
              ...item,
              display: `${brand} ${remainingWords.join(' ')}`
            };
          });
          setSuggestions(processedData);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    setGuess({ model: suggestion.model });
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

  const playVictorySound = async () => {
    console.log('Attempting to play victory sound...');
    
    try {
      // Method 1: Audio API
      if (audioMethod === 1) {
        console.log('Trying Method 1...');
        if (!victorySound.current) {
          victorySound.current = new Audio('/Lexus LFA V10 Exhaust Revs - Amazing Sound!!-yt.savetube.me-[AudioTrimmer.com].mp3');
          victorySound.current.volume = 0.7;
        }
        victorySound.current.currentTime = 0;
        await victorySound.current.play();
      }
      // Method 2: HTML Audio Element
      else if (audioMethod === 2 && audioElementRef.current) {
        console.log('Trying Method 2...');
        audioElementRef.current.volume = 0.7;
        audioElementRef.current.currentTime = 0;
        await audioElementRef.current.play();
      }
      // Method 3: Direct file
      else {
        console.log('Trying Method 3...');
        const audio = new Audio('/Lexus LFA V10 Exhaust Revs - Amazing Sound!!-yt.savetube.me-[AudioTrimmer.com].mp3');
        audio.volume = 0.7;
        await audio.play();
      }
      console.log('Audio played successfully!');
    } catch (error) {
      console.error('Error playing sound:', error);
      // Try next method
      setAudioMethod(prev => (prev % 3) + 1);
      console.log('Switching to audio method:', ((audioMethod % 3) + 1));
    }
  };

  const handleGuess = async () => {
    if (!guess.model.trim()) {
      alert('Please enter a car model');
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowSuggestions(false);
    try {
      const response = await fetch(`${API_URL}/api/guess`, {
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
      
      setGuessHistory(prev => [{
        model: guess.model,
        feedback: data,
        guessNumber: guessCount + 1
      }, ...prev]);
      setGuessCount(prev => prev + 1);
      
      if (data.isCorrect) {
        console.log('Correct guess! Triggering victory sequence...');
        setIsCorrect(true);
        setShowCongrats(true);
        
        // Try all audio methods if needed
        for (let i = 1; i <= 3; i++) {
          try {
            await playVictorySound();
            break; // Stop if successful
          } catch (e) {
            console.error(`Audio method ${i} failed:`, e);
          }
        }
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

  const handleSuggestionKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, suggestion: SearchResult) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleSuggestionClick(suggestion);
    }
  };

  // Add unused toggleFOV function to fix TypeScript error
  const _toggleFOV = () => {
    // No-op function to satisfy TypeScript
  };

  const toggleHowToPlay = () => {
    setShowHowToPlay(!showHowToPlay);
    if (showFAQ) setShowFAQ(false);
  };

  const _toggleFAQ = () => {
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
      {/* Hidden audio elements */}
      <audio id="victoryAudio1" src="/Lexus LFA V10 Exhaust Revs - Amazing Sound!!-yt.savetube.me-[AudioTrimmer.com].mp3" preload="auto" ref={audioElementRef} />
      <audio id="victoryAudio2" src="/Lexus LFA V10 Exhaust Revs - Amazing Sound!!-yt.savetube.me-[AudioTrimmer.com].mp3" preload="auto" />
      
      {showCongrats && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75">
          <div className="bg-wheeldle-card rounded-lg p-8 max-w-lg w-full mx-4 transform animate-bounce-once">
            <h2 className="text-4xl font-bold text-center mb-6 text-green-400">
              <span className="block text-6xl mb-4">🎯</span>
              You got it!
            </h2>
            <p className="text-xl text-center mb-4">
              Found today's car in {guessCount} {guessCount === 1 ? 'guess' : 'guesses'}!
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowCongrats(false)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 pt-10 pb-20">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-extrabold tracking-wide mb-4">CARTEXTO</h1>
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
              disabled={isLoading || isCorrect}
              autoComplete="off"
            />
          
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionRef}
                className="absolute top-full left-0 right-0 mt-1 bg-wheeldle-dark rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto border border-gray-700"
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
                      {suggestion.display}
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
                    <span className="text-gray-400 mr-2">#{historyItem.guessNumber}</span>
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      <div className="flex flex-col items-center">
                        <div className="text-xs sm:text-sm text-gray-300 mb-2 text-center font-bold">Brand</div>
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
                        <div className="text-xs sm:text-sm text-gray-300 mb-2 text-center font-bold">Year</div>
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
                        <div className="text-xs sm:text-sm text-gray-300 mb-2 text-center font-bold">Class</div>
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
                        <div className="text-xs sm:text-sm text-gray-300 mb-2 text-center font-bold">Cylinders</div>
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
                        <div className="text-xs sm:text-sm text-gray-300 mb-2 text-center font-bold">Engine (cc)</div>
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
                        <div className="text-xs sm:text-sm text-gray-300 mb-2 text-center font-bold">Drivetrain</div>
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
                  <div className="mt-5 p-3 sm:p-5 bg-wheeldle-hover rounded-lg">
                    <h3 className="text-base sm:text-lg font-bold mb-3 text-center">Car Details:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm text-center">
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
          className="flex items-center justify-center w-full bg-wheeldle-card p-4 rounded-lg hover:bg-wheeldle-hover transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
          <span className="font-bold text-lg">How to Play</span>
        </button>
        
        {showHowToPlay && (
          <div className="mt-2 p-5 bg-wheeldle-card rounded-lg text-gray-200 text-base">
            <div className="space-y-6">
              {/* Quick Guide */}
              <div>
                <h3 className="font-bold text-xl mb-3 text-white">Quick Guide</h3>
                <ul className="list-disc pl-6 space-y-2 font-medium">
                  <li>Type a car model in the search bar - suggestions will appear as you type</li>
                  <li>Each guess provides feedback through color-coded indicators:
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-bold">Green = Exact Match</span>
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg font-bold">Yellow = Close</span>
                      <span className="bg-red-400 text-white px-3 py-1 rounded-lg font-bold">Red = Wrong</span>
                    </div>
                  </li>
                  <li>For numerical values (Year, Cylinders, Engine size):
                    <ul className="list-circle pl-6 mt-2 space-y-1">
                      <li>↑ means the target value is higher</li>
                      <li>↓ means the target value is lower</li>
                      <li>Yellow indicates you're within a close range</li>
                    </ul>
                  </li>
                  <li>Keep guessing until you find the exact model - there's no limit on guesses!</li>
                  <li>A victory sound will play when you find the correct car 🔊</li>
                </ul>
              </div>

              {/* Attributes */}
              <div>
                <h3 className="font-bold text-xl mb-3 text-white">Car Attributes Explained</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-blue-300 font-bold">Brand:</p>
                    <p className="text-sm">The manufacturer (e.g., Toyota, BMW, Ford)</p>
                  </div>
                  <div>
                    <p className="text-blue-300 font-bold">Year:</p>
                    <p className="text-sm">When production started for this model</p>
                  </div>
                  <div>
                    <p className="text-blue-300 font-bold">Class:</p>
                    <p className="text-sm">Vehicle category (e.g., SUV, Sedan, Sports Car)</p>
                  </div>
                  <div>
                    <p className="text-blue-300 font-bold">Cylinders:</p>
                    <p className="text-sm">Number of engine cylinders (e.g., 4, 6, 8)</p>
                  </div>
                  <div>
                    <p className="text-blue-300 font-bold">Engine:</p>
                    <p className="text-sm">Engine size in cubic centimeters (cc)</p>
                  </div>
                  <div>
                    <p className="text-blue-300 font-bold">Drivetrain:</p>
                    <p className="text-sm">FWD (Front), RWD (Rear), or AWD (All-Wheel Drive)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-yellow-300 font-medium bg-yellow-900/20 p-3 rounded-lg">
                  ⚠️ Warning: Some cars may show all matching attributes (brand, year, class, etc.) but still not be the correct answer. This is because multiple models can share identical specifications. You must find the exact model to win!
                </div>
                <div className="text-sm text-blue-300 font-medium bg-blue-900/20 p-3 rounded-lg">
                  🕛 A new car is selected every day at midnight UTC. Come back daily for a new challenge!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarGuessingGame; 