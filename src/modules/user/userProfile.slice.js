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
    setUserData(state, action) {
      Object.assign(state, {...state, ...action.payload});
    },
    login(state) {
      state.isAuthenticated = true;
    },
    logout(state) {
      state.isAuthenticated = false;
    },
    resetUserState() {
      return initialUserState;
    },
    setSesarToken(state, action) {
      const {access, refresh} = action.payload;
      state.sesar.sesarToken.access = access;
      state.sesar.sesarToken.refresh = refresh;
    },
    setSesarUserCodes(state, action) {
      state.sesar.userCodes = action.payload;
    },
    setSelectedUserCode(state, action) {
      state.sesar.selectedUserCode = action.payload;
    },
    updatedKey(state, action) {
      Object.assign(state, action.payload);
    },
    setInitialSesarState(state) {
      state.sesar = initialUserState.sesar;
    },
  },
});

export const {
  login,
  logout,
  resetUserState,
  setUserData,
  setOrcidToken,
  setSesarToken,
  setSesarUserCodes,
  setSelectedUserCode,
  updatedKey,
  setInitialSesarState,
} = userProfileSlice.actions;

export default userProfileSlice.reducer;
