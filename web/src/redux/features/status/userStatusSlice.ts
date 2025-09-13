import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserStatusState {
  onlineUsers: string[];
}

const initialState: UserStatusState = {
  onlineUsers: [],
};

const userStatusSlice = createSlice({
  name: 'userStatus',
  initialState,
  reducers: {
    setUserOnline: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    setUserOffline: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(
        (userId) => userId !== action.payload
      );
    },
    setBulkOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    resetUserStatus: (state) => {
      state.onlineUsers = [];
    }
  },
});

export const {
  setUserOnline,
  setUserOffline,
  setBulkOnlineUsers,
  resetUserStatus,
} = userStatusSlice.actions;

export default userStatusSlice.reducer;