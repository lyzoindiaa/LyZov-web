import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import { setAccessToken } from "../../services/api";
// Note: resetCartLocal is dispatched in the component when logout completes

export const registerUser = createAsyncThunk("auth/register", async (payload, { rejectWithValue }) => {
  try {
    const res = await authService.register(payload);
    setAccessToken(res.data.accessToken);
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Registration failed");
  }
});

export const loginUser = createAsyncThunk("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const res = await authService.login(payload);
    setAccessToken(res.data.accessToken);
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Login failed");
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  try {
    await authService.logout();
  } finally {
    setAccessToken(null);
  }
});

export const logoutAllDevices = createAsyncThunk("auth/logoutAll", async () => {
  try {
    await authService.logoutAll();
  } finally {
    setAccessToken(null);
  }
});

export const registerSellerUser = createAsyncThunk("auth/registerSeller", async (payload, { rejectWithValue }) => {
  try {
    const res = await authService.registerSeller(payload);
    if (res.data?.accessToken) setAccessToken(res.data.accessToken);
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Seller registration failed");
  }
});

export const fetchCurrentUser = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    const res = await authService.getMe();
    return res.data.user;
  } catch (err) {
    return rejectWithValue(null);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    status: "idle",
    error: null,
    bootstrapped: false,
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
    },
    setAuthSession: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.status = "succeeded";
      state.bootstrapped = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
        state.bootstrapped = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
        state.bootstrapped = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.status = "idle";
        state.bootstrapped = true;
      })
      .addCase(logoutAllDevices.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.status = "idle";
        state.bootstrapped = true;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.status = "succeeded";
        state.bootstrapped = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.status = "idle";
        state.bootstrapped = true;
      })
      .addCase(registerSellerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.isAuthenticated = true;
        state.bootstrapped = true;
      });
  },
});

export const { clearAuthError, setUser, setAuthSession } = authSlice.actions;
export default authSlice.reducer;
