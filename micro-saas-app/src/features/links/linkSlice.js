import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  links: [],
};

const linkSlice = createSlice({
  name: 'links',
  initialState,
  reducers: {
    addLink: (state, action) => {
      state.links.push(action.payload);
    },
    setLinks: (state, action) => {
      state.links = action.payload;
    },
  },
});

export const { addLink, setLinks } = linkSlice.actions;
export default linkSlice.reducer;