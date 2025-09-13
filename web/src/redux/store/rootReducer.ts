import { combineReducers } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import authReducer from "../features/auth/authSlice";
import userStatusReducer from "../features/status/userStatusSlice";

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  userStatus: userStatusReducer,
});

export { rootReducer };