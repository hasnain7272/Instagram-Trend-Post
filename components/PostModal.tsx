import React, { useState, useEffect, useCallback, useContext } from 'react';
import { InspirationPost, GeneratedPost } from '../types';
import { generateReadyPost } from '../services/geminiService';
import { publishPostToInstagram } from '../services/instagramService';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import Spinner from './Spinner';
import { XIcon, CopyIcon, RefreshIcon, InstagramIcon, BackIcon } from './icons';
import { AppContext } from '../contexts/AppContext';

interface PostModalProps {
  post: InspirationPost;
  onClose: () => void;
}

const PostModal: React.FC<PostModalProps> = ({ post, onClose }) => {
  const { state } = useContext(AppContext);
  
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [view, setView] = useState<'generate' | 'publish' | 'success'>('generate');
  
  const [accountId, setAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // For manual method
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  
  const [publishMethod, setPublishMethod] = useState<'cloudinary' | 'manual'>('cloudinary');
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState('');
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState('');


  const handleGeneratePost = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCopySuccess('');

    try {
      const result = await generateReadyPost(post);
      setGeneratedPost(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [post]);

  useEffect(() => {
    handleGeneratePost();
  }, [handleGeneratePost]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const handleDownloadImage = useCallback(() => {
    if (!generatedPost) return;
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${generatedPost.base64Image}`;
    link.download = `instatrend-${post.id}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedPost, post.id]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedPost) return;

    setIsPublishing(true);
    setPublishError(null);

    try {
      let finalImageUrl = imageUrl; // Default to manual URL

      if (publishMethod === 'cloudinary') {
        if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
          throw new Error("Cloudinary Cloud Name and Upload Preset are required.");
        }
        // Step 1: Upload to Cloudinary
        finalImageUrl = await uploadImageToCloudinary({
          base64Image: generatedPost.base64Image,
          cloudName: cloudinaryCloudName,
          uploadPreset: cloudinaryUploadPreset,
        });
      }

      if (!finalImageUrl) {
        throw new Error("Could not get a valid image URL to publish.");
      }
      
      // Step 2: Publish to Instagram
      await publishPostToInstagram({
        accountId,
        accessToken,
        imageUrl: finalImageUrl,
        caption: fullCaption,
      });
      
      setView('success');
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'An unknown publishing error occurred.');
    } finally {
      setIsPublishing(false);
    }
  };
  
  const fullCaption = `${generatedPost?.caption}\n\n${generatedPost?.hashtags.join(' ')}`;

  const renderGenerateView = () => (
    <>
      <div className="md:w-1/2 relative bg-gray-900">
        {(isLoading || !generatedPost) && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <Spinner />
          </div>
        )}
        {generatedPost && (
          <img 
            src={`data:image/jpeg;base64,${generatedPost.base64Image}`}
            alt="AI Generated Post" 
            className={`w-full h-64 md:h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          />
        )}
      </div>
      <div className="md:w-1/2 p-6 flex flex-col bg-gray-800">
         <div className="flex justify-between items-start mb-4">
           <div>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                Your Generated Post
              </h2>
              <p className="text-sm text-gray-400">Inspired by @{post.username}</p>
           </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-700 transition-colors">
            <XIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-4">
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={handleGeneratePost} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center">
                  <RefreshIcon className="h-5 w-5 mr-2" />
                  Try Again
              </button>
            </div>
          )}
          {generatedPost && !isLoading && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">CAPTION</h3>
                <p className="text-gray-200 whitespace-pre-wrap text-base">{generatedPost.caption}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">HASHTAGS</h3>
                <p className="text-purple-300/90 text-sm leading-relaxed">{generatedPost.hashtags.join(' ')}</p>
              </div>
            </div>
          )}
        </div>

        {!isLoading && generatedPost && (
          <div className="mt-6 pt-4 border-t border-gray-700 flex flex-wrap gap-2">
              <button onClick={() => handleCopyToClipboard(fullCaption)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center text-sm">
                  <CopyIcon className="h-4 w-4 mr-2" />
                  {copySuccess ? copySuccess : 'Copy Caption & Hashtags'}
              </button>
              <button onClick={() => setView('publish')} className="flex-1 bg-gradient-to-r from-pink-500 to-orange-400 hover:opacity-90 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center text-sm">
                  <InstagramIcon className="h-5 w-5 mr-2" />
                  Post to Instagram
              </button>
          </div>
        )}
      </div>
    </>
  );

  const renderPublishView = () => (
    <div className="w-full p-6 md:p-8 flex flex-col bg-gray-800">
      <div className="flex items-center mb-6">
        <button onClick={() => setView('generate')} className="p-2 rounded-full hover:bg-gray-700 transition-colors mr-3">
          <BackIcon className="h-6 w-6 text-gray-300" />
        </button>
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">
          Publish to Instagram
        </h2>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-4">
        <div className="flex justify-center mb-6 border border-gray-700 rounded-full p-1 w-max mx-auto bg-gray-900/50">
          <button onClick={() => setPublishMethod('cloudinary')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${publishMethod === 'cloudinary' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            Use Cloudinary
          </button>
          <button onClick={() => setPublishMethod('manual')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${publishMethod === 'manual' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            Manual Method
          </button>
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
            {publishMethod === 'cloudinary' && (
                <div className="space-y-4 p-4 border border-gray-700/50 rounded-lg bg-gray-800/50">
                    <h3 className="text-lg font-semibold text-gray-200">1. Cloudinary Details</h3>
                    <p className="text-gray-400 text-sm">
                        Automatically upload your image to get a public URL. This is the easiest way to publish.
                    </p>
                    <div>
                        <label htmlFor="cloudinaryCloudName" className="block text-sm font-medium text-gray-300 mb-1">Cloudinary Cloud Name</label>
                        <input type="text" id="cloudinaryCloudName" placeholder="your-cloud-name" value={cloudinaryCloudName} onChange={(e) => setCloudinaryCloudName(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                    <div>
                        <label htmlFor="cloudinaryUploadPreset" className="block text-sm font-medium text-gray-300 mb-1">Cloudinary Upload Preset</label>
                        <input type="text" id="cloudinaryUploadPreset" placeholder="your-unsigned-preset" value={cloudinaryUploadPreset} onChange={(e) => setCloudinaryUploadPreset(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                    <p className="text-gray-500 text-xs">
                        This is more secure than using API keys on the frontend. <a href="https://cloudinary.com/documentation/upload_presets" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">Learn how to create an unsigned upload preset</a>.
                    </p>
                </div>
            )}

            {publishMethod === 'manual' && (
                <div className="space-y-4 p-4 border border-gray-700/50 rounded-lg bg-gray-800/50">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Step 1: Download & Host Image</h3>
                        <p className="text-gray-400 mb-3 text-sm">
                            First, download the image. Then, upload it to a public host like{' '}
                            <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Imgur</a>
                            {' '}and copy the <strong className="text-gray-200">Direct Link</strong>.
                        </p>
                        <button type="button" onClick={handleDownloadImage} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center">
                            Download Generated Image
                        </button>
                    </div>
                     <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-1">Step 2: Paste Public Image URL</label>
                        <input type="url" id="imageUrl" placeholder="https://i.imgur.com/example.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" />
                    </div>
                </div>
            )}

            <div className="space-y-4 pt-4 border-t border-gray-700/50">
                 <h3 className="text-lg font-semibold text-gray-200">{publishMethod === 'cloudinary' ? '2.' : '3.'} Instagram Credentials</h3>
                <div>
                  <label htmlFor="accountId" className="block text-sm font-medium text-gray-300 mb-1">Instagram Account ID</label>
                  <input type="text" id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" />
                </div>
                <div>
                  <label htmlFor="accessToken" className="block text-sm font-medium text-gray-300 mb-1">User Access Token</label>
                  <input type="password" id="accessToken" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" />
                </div>
                 <p className="text-gray-500 text-xs">
                    Need help? <a href="https://developers.facebook.com/docs/instagram-api/getting-started" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">Learn how to get your ID and Token</a>.
                </p>
            </div>
            
            <button type="submit" disabled={isPublishing || !accountId || !accessToken} className="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:opacity-90 text-white font-bold py-2.5 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-11">
                {isPublishing ? <Spinner /> : (
                    <>
                        <InstagramIcon className="h-5 w-5 mr-2" />
                        {publishMethod === 'cloudinary' ? 'Upload & Publish' : 'Publish Now'}
                    </>
                )}
            </button>
            {publishError && <p className="text-red-400 text-sm text-center mt-2">{publishError}</p>}
        </form>
      </div>
    </div>
  );

  const renderSuccessView = () => (
    <div className="w-full p-8 md:p-12 flex flex-col bg-gray-800 text-center items-center justify-center">
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Post Published!</h2>
      <p className="text-gray-400 mb-6">Your post has been sent to the Instagram API and should be live.</p>
      <button onClick={onClose} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-md transition duration-200">
        Done
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-40 p-4" onClick={onClose}>
      <div style={{maxHeight: '90vh'}} className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-700/50 flex flex-col md:flex-row overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {view === 'generate' && renderGenerateView()}
        {view === 'publish' && renderPublishView()}
        {view === 'success' && renderSuccessView()}
      </div>
    </div>
  );
};

export default PostModal;