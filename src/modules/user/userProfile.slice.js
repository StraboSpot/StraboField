import {createSlice} from '@reduxjs/toolkit';

const initialUserState = {
  email: null,
  encoded_login: null,
  image: null,
  isAuthenticated: false,
  mapboxToken: null,
  name: null,
  sesar: {
    selectedUserCode: null,
    userCodes: [],
    sesarToken: {
      access: '',
      refresh: '',
    },
  },
};

// createSlice combines reducers, actions, and constants
const userProfileSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    login(state) {
      state.isAuthenticated = true;
    },
    logout(state) {
      state.isAuthenticated = false;
    },
    resetUserState() {
      return initialUserState;
    },
    setInitialSesarState(state) {
      state.sesar = initialUserState.sesar;
    },
    setSelectedUserCode(state, action) {
      state.sesar.selectedUserCode = action.payload;
    },
    setSesarToken(state, action) {
      const {access, refresh} = action.payload;
      state.sesar.sesarToken.access = access;
      state.sesar.sesarToken.refresh = refresh;
    },
    setSesarUserCodes(state, action) {
      state.sesar.userCodes = action.payload;
    },
    setUserData(state, action) {
      Object.assign(state, {...state, ...action.payload});
    },
    updatedKey(state, action) {
      Object.assign(state, action.payload);
    },
  },
});

export const {
  login,
  logout,
  resetUserState,
  setInitialSesarState,
  setOrcidToken,
  setSelectedUserCode,
  setSesarToken,
  setSesarUserCodes,
  setUserData,
  updatedKey,
} = userProfileSlice.actions;

export default userProfileSlice.reducer;
