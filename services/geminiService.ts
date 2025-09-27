

import { GoogleGenAI, Type } from "@google/genai";
import { InspirationPost, GeneratedPost } from '../types';

export const fetchInspirationPosts = async (location: string): Promise<InspirationPost[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Using Google Search, find 5 recent and visually interesting Instagram posts that are trending in ${location}.
    For each post, provide a detailed, vivid description of the image content (imageDescription), the original username, and the original caption.
    The imageDescription is the most important part; it should be descriptive enough for an AI image generator to create a new image.
    Do not include any URLs.
    Return the result as a valid JSON array of objects. Each object must have a unique "id" field (can be a random string), a "username" field, a "caption" field, and an "imageDescription" field.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Fix: Log grounding chunks to comply with API guidelines for using googleSearch.
    console.log("Grounding chunks from Google Search:", response.candidates?.[0]?.groundingMetadata?.groundingChunks);

    // The response text may be wrapped in ```json ... ```, so we need to extract it.
    let jsonString = response.text.trim();
    const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonString = jsonMatch[1];
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error fetching inspiration posts:", error);
    throw new Error("Failed to find inspiration. The AI may be busy or the API key may be invalid. Please try again.");
  }
};

export const generateReadyPost = async (inspiration: InspirationPost): Promise<GeneratedPost> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Step 1: Generate a new image using Imagen 4
    const imageResponse = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A high-quality, realistic photograph inspired by: "${inspiration.imageDescription}". Professional, clean, and suitable for Instagram.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });
    
    const base64Image = imageResponse.generatedImages[0]?.image.imageBytes;
    if (!base64Image) {
        throw new Error("AI failed to generate an image.");
    }

    // Step 2: Generate a new caption and hashtags
    const textPrompt = `
      You are an expert Instagram content creator.
      Based on the inspiration from this caption: "${inspiration.caption}", and this image description: "${inspiration.imageDescription}", create a brand new, engaging post.
      Generate a short, catchy caption.
      Generate a list of 7 relevant and effective hashtags.
    `;
    const textResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: textPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["caption", "hashtags"],
        },
      },
    });

    const jsonString = textResponse.text.trim();
    const textContent = JSON.parse(jsonString);
    
    return {
      base64Image,
      ...textContent,
    };
  } catch (error) {
    console.error("Error generating ready post:", error);
    throw new Error("Failed to generate the post. The AI may be experiencing high traffic or the API key may be invalid. Please try again.");
  }
};