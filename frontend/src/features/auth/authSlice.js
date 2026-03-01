import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi';
import toast from 'react-hot-toast';

// ── Async thunks ──────────────────────────────────────────────────────────────

export const register = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await authApi.register(formData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await authApi.login(credentials);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
    } catch {
      // Always clear local state even if API call fails
    }
  }
);

// Called on app load to rehydrate user from stored accessToken
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { getState, rejectWithValue }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return rejectWithValue('No token');
    try {
      const { data } = await authApi.getMe();
      return { user: data.user, accessToken: token };
    } catch {
      localStorage.removeItem('accessToken');
      return rejectWithValue('Session expired');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await authApi.updateMe(formData);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Update failed');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        null,
    accessToken: localStorage.getItem('accessToken') || null,
    status:      'idle',    // 'idle' | 'loading' | 'succeeded' | 'failed'
    error:       null,
  },
  reducers: {
    // Called by the Axios interceptor when a token refresh succeeds
    setAccessToken(state, action) {
      state.accessToken = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
    // Synchronous local logout (used by interceptor on refresh failure)
    logout(state) {
      state.user        = null;
      state.accessToken = null;
      localStorage.removeItem('accessToken');
    },
  },
  extraReducers: (builder) => {
    // register
    builder
      .addCase(register.pending,   (state) => { state.status = 'loading'; state.error = null; })
      .addCase(register.fulfilled, (state, { payload }) => {
        state.status      = 'succeeded';
        state.user        = payload.user;
        state.accessToken = payload.accessToken;
        localStorage.setItem('accessToken', payload.accessToken);
        toast.success(`Welcome to ShopSphere, ${payload.user.name}!`);
      })
      .addCase(register.rejected,  (state, { payload }) => {
        state.status = 'failed';
        state.error  = payload;
        toast.error(payload);
      });

    // login
    builder
      .addCase(login.pending,   (state) => { state.status = 'loading'; state.error = null; })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.status      = 'succeeded';
        state.user        = payload.user;
        state.accessToken = payload.accessToken;
        localStorage.setItem('accessToken', payload.accessToken);
        toast.success(`Welcome back, ${payload.user.name}!`);
      })
      .addCase(login.rejected,  (state, { payload }) => {
        state.status = 'failed';
        state.error  = payload;
        toast.error(payload);
      });

    // logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user        = null;
        state.accessToken = null;
        state.status      = 'idle';
        localStorage.removeItem('accessToken');
        toast.success('Logged out successfully.');
      });

    // loadUser
    builder
      .addCase(loadUser.fulfilled, (state, { payload }) => {
        state.user        = payload.user;
        state.accessToken = payload.accessToken;
        state.status      = 'succeeded';
      })
      .addCase(loadUser.rejected, (state) => {
        state.status      = 'idle';
        state.accessToken = null;
      });

    // updateProfile
    builder
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.user = payload;
        toast.success('Profile updated successfully.');
      })
      .addCase(updateProfile.rejected, (_, { payload }) => {
        toast.error(payload);
      });
  },
});

export const { setAccessToken } = authSlice.actions;
export { logout as logoutAction };
export default authSlice.reducer;
