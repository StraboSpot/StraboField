import {createSlice} from '@reduxjs/toolkit';

// import config from '../../utils/config';

// const rockedToken = config.get('rockd_access_token');
// const rockdExpiration = 1839181062830;

const initialUserState = {
  default_manual_measurement: false,
  email: null,
  encoded_login: null,
  image: null,
  isAuthenticated: false,
  is_utm_display: false,
  mapboxToken: null,
  macrostrat: {
    // token: __DEV__ ? rockedToken : null,
    token: null,
    // expires: __DEV__ ? rockdExpiration : null,
    expires: null,
    checkedInSpotIds: [],
  },

  measurement_convention: 'strike_dip',
  name: null,
  orcidToken: null,
  sesar: {
    selectedUserCode: null,
    userCodes: [],
    sesarToken: {
      access: '',
      refresh: '',
    },
  },
  straboUserId: null,
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
    addedCheckedInSpotId(state, action) {
      if (!state.macrostrat.checkedInSpotIds.includes(action.payload)) {
        state.macrostrat.checkedInSpotIds.push(action.payload);
      }
    },
    setMacrostratToken(state, action) {
      state.macrostrat.token = action.payload.token;
      state.macrostrat.expires = action.payload.expires;
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
  addedCheckedInSpotId,
  login,
  logout,
  resetUserState,
  setInitialSesarState,
  setMacrostratToken,
  setOrcidToken,
  setSelectedUserCode,
  setSesarToken,
  setSesarUserCodes,
  setUserData,
  updatedKey,
} = userProfileSlice.actions;

export default userProfileSlice.reducer;
