
import React, { useContext } from 'react';
import { InspirationPost } from '../types';
import { AppContext } from '../contexts/AppContext';

interface InspirationCardProps {
  post: InspirationPost;
}

const InspirationCard: React.FC<InspirationCardProps> = ({ post }) => {
  const { dispatch } = useContext(AppContext);

  const handleGenerateClick = () => {
    dispatch({ type: 'SET_POST_TO_GENERATE', payload: post });
  };
  
  // Generate a thematic placeholder image from Unsplash
  const placeholderImageUrl = `https://source.unsplash.com/random/600x600?${encodeURIComponent(post.imageDescription.split(' ').slice(0, 3).join(','))}`;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://via.placeholder.com/600?text=Inspiration';
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden group border border-gray-700/50 transform hover:-translate-y-2 transition-transform duration-300">
      <div className="relative">
        <img 
            src={placeholderImageUrl} 
            alt={post.imageDescription}
            className="w-full h-64 object-cover"
            onError={handleImageError}
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300 flex items-center justify-center p-4">
            <button
                onClick={handleGenerateClick}
                className="bg-purple-600/80 hover:bg-purple-700/90 text-white font-bold py-3 px-6 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300 text-center"
            >
                Generate Post
            </button>
        </div>
      </div>
       <div className="p-3">
          <p className="text-gray-400 text-xs truncate" title={`Inspired by @${post.username}: "${post.caption}"`}>
            Inspired by @{post.username}
          </p>
        </div>
    </div>
  );
};

export default InspirationCard;
