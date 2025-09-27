// This script is designed to be run in a Node.js environment (e.g., via GitHub Actions)
// To run it, you need to install its dependencies first: npm install @google/genai node-fetch

// Load environment variables from .env file for local development
import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import fetch from 'node-fetch';

// --- CONFIGURATION ---
// Secrets are loaded from environment variables for security
const {
  API_KEY, // Your Google Gemini API Key
  INSTAGRAM_ACCOUNT_ID,
  INSTAGRAM_ACCESS_TOKEN,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} = process.env;

// The topic is taken from the command line arguments
const LOCATION = process.argv[2] || 'Tokyo';

// --- API SERVICES (Node.js version) ---

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fetchInspirationPosts = async (location) => {
  console.log(`Searching for trends in ${location}...`);
  const prompt = `Using Google Search, find 5 recent and visually interesting Instagram posts that are trending in ${location}. For each post, provide a detailed, vivid description of the image content (imageDescription), the original username, and the original caption. The imageDescription is the most important part; it should be descriptive enough for an AI image generator to create a new image. Do not include any URLs. Return the result as a valid JSON array of objects. Each object must have a unique "id" field (can be a random string), a "username" field, a "caption" field, and an "imageDescription" field.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });
  
  // Fix: Log grounding chunks to comply with API guidelines for using googleSearch.
  console.log("Grounding chunks from Google Search:", response.candidates?.[0]?.groundingMetadata?.groundingChunks);
  
  let jsonString = response.text.trim().replace(/^```json|```$/g, '').trim();
  return JSON.parse(jsonString);
};

const generateReadyPost = async (inspiration) => {
    console.log('Generating new image with Imagen...');
    const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A high-quality, realistic photograph inspired by: "${inspiration.imageDescription}". Professional, clean, and suitable for Instagram.`,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' },
    });
    const base64Image = imageResponse.generatedImages[0]?.image.imageBytes;
    if (!base64Image) throw new Error("AI failed to generate an image.");

    console.log('Generating new caption and hashtags...');
    const textPrompt = `You are an expert Instagram content creator. Based on the inspiration from this caption: "${inspiration.caption}", and this image description: "${inspiration.imageDescription}", create a brand new, engaging post. Generate a short, catchy caption. Generate a list of 7 relevant and effective hashtags.`;
    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    caption: { type: Type.STRING },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["caption", "hashtags"],
            },
        },
    });
    const textContent = JSON.parse(textResponse.text.trim());
    return { base64Image, ...textContent };
};

const uploadImageToCloudinary = async (base64Image) => {
    console.log('Uploading image to Cloudinary...');
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            file: `data:image/jpeg;base64,${base64Image}`,
            upload_preset: CLOUDINARY_UPLOAD_PRESET,
        }),
    });
    const data = await response.json();
    if (!response.ok || !data.secure_url) {
        throw new Error(data.error?.message || 'Cloudinary upload failed.');
    }
    console.log('Image uploaded successfully.');
    return data.secure_url;
};

const publishPostToInstagram = async ({ imageUrl, caption, hashtags }) => {
    const fullCaption = `${caption}\n\n${hashtags.join(' ')}`;
    console.log('Creating Instagram media container...');
    const containerUrl = `https://graph.facebook.com/v20.0/${INSTAGRAM_ACCOUNT_ID}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(fullCaption)}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const containerResponse = await fetch(containerUrl, { method: 'POST' }).then(res => res.json());
    if (containerResponse.error) throw new Error(`Instagram container error: ${containerResponse.error.message}`);
    const creationId = containerResponse.id;

    console.log('Polling for media container readiness...');
    let retries = 10;
    while (retries > 0) {
        const statusUrl = `https://graph.facebook.com/${creationId}?fields=status_code&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
        const statusResponse = await fetch(statusUrl).then(res => res.json());
        if (statusResponse.status_code === 'FINISHED') break;
        if (statusResponse.status_code === 'ERROR') throw new Error('Media processing failed on Instagram.');
        await new Promise(resolve => setTimeout(resolve, 3000));
        retries--;
    }
    if (retries === 0) throw new Error("Media processing timed out.");
    
    console.log('Publishing post to Instagram...');
    const publishUrl = `https://graph.facebook.com/v20.0/${INSTAGRAM_ACCOUNT_ID}/media_publish?creation_id=${creationId}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    const publishResponse = await fetch(publishUrl, { method: 'POST' }).then(res => res.json());
    if (publishResponse.error) throw new Error(`Instagram publishing error: ${publishResponse.error.message}`);
    
    console.log(`Successfully published post with ID: ${publishResponse.id}`);
    return publishResponse.id;
};


// --- MAIN EXECUTION LOGIC ---
async function main() {
    try {
        if (!API_KEY || !INSTAGRAM_ACCOUNT_ID || !INSTAGRAM_ACCESS_TOKEN || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            throw new Error("One or more required environment variables are missing. Please configure them in your repository secrets or local .env file.");
        }
        const posts = await fetchInspirationPosts(LOCATION);
        if (!posts || posts.length === 0) {
            console.log("No inspiration found. Exiting.");
            return;
        }
        const inspiration = posts[0]; // Use the first trend
        console.log(`Generating post based on inspiration from @${inspiration.username}`);
        
        const { base64Image, caption, hashtags } = await generateReadyPost(inspiration);
        const imageUrl = await uploadImageToCloudinary(base64Image);
        await publishPostToInstagram({ imageUrl, caption, hashtags });

        console.log('\n✨ Post generation and publishing complete! ✨');

    } catch (error) {
        console.error('\n❌ An error occurred:', error.message);
        process.exit(1);
    }
}

main();
