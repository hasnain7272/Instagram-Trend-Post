
export interface InspirationPost {
  id: string;
  username: string;
  caption: string;
  imageDescription: string; 
  // This will be used to generate the new image and a placeholder.
}

export interface GeneratedPost {
  base64Image: string;
  caption: string;
  hashtags: string[];
}

export interface AppState {
  isLoading: boolean;
  error: string | null;
  inspirationPosts: InspirationPost[];
  postToGenerate: InspirationPost | null;
}

export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INSPIRATION_POSTS'; payload: InspirationPost[] }
  | { type: 'SET_POST_TO_GENERATE'; payload: InspirationPost | null };