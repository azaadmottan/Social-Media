import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  data: any | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  data: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction) {
      state.data = action.payload;
      state.isAuthenticated = true;
    },
    clearUser(state) {
      state.data = null;
      state.isAuthenticated = false;
    }
  }
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;