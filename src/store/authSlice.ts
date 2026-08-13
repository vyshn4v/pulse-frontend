import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGoogleConfigured: boolean;
  sessionExpired: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isGoogleConfigured: true,
  sessionExpired: false,
  error: null,
};

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.status === 401) {
      return rejectWithValue('session_expired');
    }
    if (!res.ok) return null;
    const data = await res.json();
    return data as UserProfile | null;
  } catch {
    return null;
  }
});

export const checkGoogleAvailability = createAsyncThunk('auth/checkGoogleAvailability', async () => {
  const res = await fetch('/api/auth/available');
  if (!res.ok) return false;
  const data = await res.json();
  return !!data.enabled;
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await fetch('/api/auth/logout', { credentials: 'include' });
  return null;
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.sessionExpired = false;
      state.isLoading = false;
    },
    setSessionExpired: (state, action: PayloadAction<boolean>) => {
      state.sessionExpired = action.payload;
      if (action.payload) {
        state.isAuthenticated = false;
        state.user = null;
      }
      state.isLoading = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.sessionExpired = false;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.sessionExpired = false;
        state.isLoading = false;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        if (action.payload === 'session_expired') {
          state.sessionExpired = true;
        }
        state.isLoading = false;
      })
      .addCase(checkGoogleAvailability.fulfilled, (state, action) => {
        state.isGoogleConfigured = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.sessionExpired = false;
        state.isLoading = false;
      });
  },
});

export const { setUser, setSessionExpired, clearAuth } = authSlice.actions;
export default authSlice.reducer;
