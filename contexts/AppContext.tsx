import React, { createContext, useReducer, Dispatch, ReactNode } from 'react';
import { AppState, AppAction } from '../types';

const initialState: AppState = {
  isLoading: false,
  error: null,
  inspirationPosts: [],
  postToGenerate: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INSPIRATION_POSTS':
      return { ...state, inspirationPosts: action.payload };
    case 'SET_POST_TO_GENERATE':
      return { ...state, postToGenerate: action.payload };
    default:
      return state;
  }
};

interface AppContextProps {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextProps>({} as AppContextProps);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};