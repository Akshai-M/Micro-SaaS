import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import linkReducer from './features/links/linkSlice';
import analyticsReducer from './features/analytics/analyticsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  links: linkReducer,
  analytics: analyticsReducer,
});

export default rootReducer;