"use client";

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";

import {
  ApiToken,
  createToken,
  CreateTokenRequest,
  deleteToken,
  getToken,
  getTokenUsage,
  listTokens,
  TokenUsage,
  updateToken,
} from "@/utils/api/tokenClient";

// Define state type
interface TokenState {
  tokens: ApiToken[];
  selectedToken: ApiToken | null;
  tokenUsage: TokenUsage[] | null;
  isLoading: boolean;
  error: string | null;
  newlyCreatedToken: ApiToken | null; // To display the token string once after creation
}

// Define action types
type TokenAction =
  | { type: "FETCH_TOKENS_START" }
  | { type: "FETCH_TOKENS_SUCCESS"; payload: ApiToken[] }
  | { type: "FETCH_TOKENS_ERROR"; payload: string }
  | { type: "SELECT_TOKEN_START"; payload: string }
  | { type: "SELECT_TOKEN_SUCCESS"; payload: ApiToken }
  | { type: "SELECT_TOKEN_ERROR"; payload: string }
  | { type: "FETCH_TOKEN_USAGE_START" }
  | { type: "FETCH_TOKEN_USAGE_SUCCESS"; payload: TokenUsage[] }
  | { type: "FETCH_TOKEN_USAGE_ERROR"; payload: string }
  | { type: "CREATE_TOKEN_START" }
  | { type: "CREATE_TOKEN_SUCCESS"; payload: ApiToken }
  | { type: "CREATE_TOKEN_ERROR"; payload: string }
  | { type: "UPDATE_TOKEN_START" }
  | { type: "UPDATE_TOKEN_SUCCESS"; payload: ApiToken }
  | { type: "UPDATE_TOKEN_ERROR"; payload: string }
  | { type: "DELETE_TOKEN_START"; payload: string }
  | { type: "DELETE_TOKEN_SUCCESS"; payload: string }
  | { type: "DELETE_TOKEN_ERROR"; payload: string }
  | { type: "CLEAR_SELECTED_TOKEN" }
  | { type: "CLEAR_NEW_TOKEN" }
  | { type: "CLEAR_ERROR" };

// Initial state
const initialState: TokenState = {
  tokens: [],
  selectedToken: null,
  tokenUsage: null,
  isLoading: false,
  error: null,
  newlyCreatedToken: null,
};

// Create context
interface TokenContextType {
  state: TokenState;
  fetchTokens: () => Promise<void>;
  selectToken: (id: string) => Promise<void>;
  fetchTokenUsage: (id: string, period?: string) => Promise<void>;
  createNewToken: (tokenData: CreateTokenRequest) => Promise<void>;
  updateSelectedToken: (name: string) => Promise<void>;
  deleteSelectedToken: () => Promise<void>;
  clearSelectedToken: () => void;
  clearNewToken: () => void;
  clearError: () => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

// Reducer function
const tokenReducer = (state: TokenState, action: TokenAction): TokenState => {
  switch (action.type) {
    case "FETCH_TOKENS_START":
    case "SELECT_TOKEN_START":
    case "FETCH_TOKEN_USAGE_START":
    case "CREATE_TOKEN_START":
    case "UPDATE_TOKEN_START":
      return { ...state, isLoading: true, error: null };

    case "FETCH_TOKENS_SUCCESS":
      return {
        ...state,
        isLoading: false,
        tokens: action.payload,
        error: null,
      };

    case "SELECT_TOKEN_SUCCESS":
      return {
        ...state,
        isLoading: false,
        selectedToken: action.payload,
        error: null,
      };

    case "FETCH_TOKEN_USAGE_SUCCESS":
      return {
        ...state,
        isLoading: false,
        tokenUsage: action.payload,
        error: null,
      };

    case "CREATE_TOKEN_SUCCESS":
      return {
        ...state,
        isLoading: false,
        tokens: [...state.tokens, action.payload],
        newlyCreatedToken: action.payload,
        error: null,
      };

    case "UPDATE_TOKEN_SUCCESS":
      return {
        ...state,
        isLoading: false,
        tokens: state.tokens.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
        selectedToken: action.payload,
        error: null,
      };

    case "DELETE_TOKEN_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "DELETE_TOKEN_SUCCESS":
      return {
        ...state,
        isLoading: false,
        tokens: state.tokens.filter((t) => t.id !== action.payload),
        selectedToken: null,
        tokenUsage: null,
        error: null,
      };

    case "FETCH_TOKENS_ERROR":
    case "SELECT_TOKEN_ERROR":
    case "FETCH_TOKEN_USAGE_ERROR":
    case "CREATE_TOKEN_ERROR":
    case "UPDATE_TOKEN_ERROR":
    case "DELETE_TOKEN_ERROR":
      return { ...state, isLoading: false, error: action.payload };

    case "CLEAR_SELECTED_TOKEN":
      return { ...state, selectedToken: null, tokenUsage: null };

    case "CLEAR_NEW_TOKEN":
      return { ...state, newlyCreatedToken: null };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
};

// Provider component
export const TokenProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(tokenReducer, initialState);

  // Load tokens when component mounts
  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      dispatch({ type: "FETCH_TOKENS_START" });
      const tokens = await listTokens();
      dispatch({ type: "FETCH_TOKENS_SUCCESS", payload: tokens.data });
    } catch (error) {
      dispatch({
        type: "FETCH_TOKENS_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to fetch API tokens",
      });
    }
  };

  const selectToken = async (id: string) => {
    try {
      dispatch({ type: "SELECT_TOKEN_START", payload: id });
      const token = await getToken(id);
      dispatch({ type: "SELECT_TOKEN_SUCCESS", payload: token });

      // Also fetch usage stats
      await fetchTokenUsage(id);
    } catch (error) {
      dispatch({
        type: "SELECT_TOKEN_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to fetch token details",
      });
    }
  };

  const fetchTokenUsage = async (id: string, period = "monthly") => {
    try {
      dispatch({ type: "FETCH_TOKEN_USAGE_START" });
      const usage = await getTokenUsage(id, period);
      dispatch({ type: "FETCH_TOKEN_USAGE_SUCCESS", payload: usage });
    } catch (error) {
      dispatch({
        type: "FETCH_TOKEN_USAGE_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to fetch token usage statistics",
      });
    }
  };

  const createNewToken = async (tokenData: CreateTokenRequest) => {
    try {
      dispatch({ type: "CREATE_TOKEN_START" });
      const newToken = await createToken(tokenData);
      dispatch({ type: "CREATE_TOKEN_SUCCESS", payload: newToken });
    } catch (error) {
      dispatch({
        type: "CREATE_TOKEN_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to create new API token",
      });
      throw error;
    }
  };

  const updateSelectedToken = async (name: string) => {
    if (!state.selectedToken) {
      dispatch({ type: "UPDATE_TOKEN_ERROR", payload: "No token selected" });
      return;
    }

    try {
      dispatch({ type: "UPDATE_TOKEN_START" });
      const updated = await updateToken(state.selectedToken.id, name);
      dispatch({ type: "UPDATE_TOKEN_SUCCESS", payload: updated });
    } catch (error) {
      dispatch({
        type: "UPDATE_TOKEN_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to update API token",
      });
      throw error;
    }
  };

  const deleteSelectedToken = async () => {
    if (!state.selectedToken) {
      dispatch({ type: "DELETE_TOKEN_ERROR", payload: "No token selected" });
      return;
    }

    try {
      const id = state.selectedToken.id;
      dispatch({ type: "DELETE_TOKEN_START", payload: id });
      await deleteToken(id);
      dispatch({ type: "DELETE_TOKEN_SUCCESS", payload: id });
    } catch (error) {
      dispatch({
        type: "DELETE_TOKEN_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to delete API token",
      });
      throw error;
    }
  };

  const clearSelectedToken = () => {
    dispatch({ type: "CLEAR_SELECTED_TOKEN" });
  };

  const clearNewToken = () => {
    dispatch({ type: "CLEAR_NEW_TOKEN" });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  return (
    <TokenContext.Provider
      value={{
        state,
        fetchTokens,
        selectToken,
        fetchTokenUsage,
        createNewToken,
        updateSelectedToken,
        deleteSelectedToken,
        clearSelectedToken,
        clearNewToken,
        clearError,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

// Custom hook to use the context
export const useTokenContext = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useTokenContext must be used within a TokenProvider");
  }
  return context;
};
