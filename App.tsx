import React, { useContext, useState, useCallback } from 'react';
import { AppContext } from './contexts/AppContext';
import { fetchInspirationPosts } from './services/geminiService';
import { SearchIcon } from './components/icons';
import InspirationCard from './components/InspirationCard';
import PostModal from './components/PostModal';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { isLoading, error, inspirationPosts, postToGenerate } = state;
  const [locationInput, setLocationInput] = useState('');

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_INSPIRATION_POSTS', payload: [] });
    dispatch({ type: 'SET_POST_TO_GENERATE', payload: null });

    try {
      const posts = await fetchInspirationPosts(locationInput);
      dispatch({ type: 'SET_INSPIRATION_POSTS', payload: posts.slice(0, 5) });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch, locationInput]);
  
  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <main className="container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
              InstaTrend Post Generator
            </h1>
            <p className="text-gray-400">Enter a city to discover real trends and generate a unique, AI-powered post.</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-12 flex items-center border-2 border-gray-600 rounded-full focus-within:border-purple-500 transition-colors duration-300 p-1">
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="e.g., Tokyo, New York, London..."
            className="flex-grow bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg px-6 py-3"
            aria-label="Enter city"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold p-4 rounded-full transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            aria-label="Search trends"
          >
            <SearchIcon className="h-6 w-6" />
          </button>
        </form>

        {isLoading && <Spinner />}
        {error && <div className="text-center text-red-400 p-4 bg-red-900/50 rounded-md max-w-xl mx-auto">{error}</div>}

        {inspirationPosts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-center mb-6">Choose Your Inspiration</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {inspirationPosts.map(post => (
                <InspirationCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </main>
      
      {postToGenerate && <PostModal post={postToGenerate} onClose={() => dispatch({ type: 'SET_POST_TO_GENERATE', payload: null })} />}
    </div>
  );
};

export default App;