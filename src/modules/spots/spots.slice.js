import {createSlice, current} from '@reduxjs/toolkit';

import {isEmpty} from '../../shared/Helpers';

const initialSpotState = {
  intersectedSpotsForTagging: [],
  recentViews: [],
  selectedAttributes: [],
  selectedSpot: {},
  spots: {},
};

const spotSlice = createSlice({
  name: 'spot',
  initialState: initialSpotState,
  reducers: {
    addedSpotsFromDevice(state, action) {
      state.spots = action.payload;
    },
    addedSpotsFromServer(state, action) {
      state.spots = Object.assign({}, ...action.payload.map(spot => ({...state.spots, [spot.properties.id]: spot})));
      console.log('ADDED Spots:', state.spots, 'in Existing Spots:', current(state));
    },
    clearedSelectedSpots(state) {
      state.selectedSpot = {};
    },
    clearedSpots(state) {
      state.selectedSpot = {};
      state.spots = {};
      state.recentViews = [];
    },
    deletedSpot(state, action) {
      const {[action.payload]: deletedSpot, ...remainingSpots} = state.spots;
      console.log('DELETED Spot:', action.payload, deletedSpot);
      console.log('Remaining Spots:', remainingSpots);
      state.selectedSpot = {};
      state.spots = remainingSpots;
      state.recentViews = state.recentViews.filter(id => id !== action.payload);
    },
    deletedSpots(state, action) {
      const spotIds = action.payload;     // ids of spots to delete
      const spotIdsStrings = spotIds.map(spotId => spotId.toString());
      const remainingSpotsObj = Object.entries(state.spots).reduce((acc, [key, val]) => {
        return spotIdsStrings.includes(key) ? acc : {...acc, [key]: val};
      }, {});
      state.selectedSpot = {};
      state.spots = remainingSpotsObj;
      state.recentViews = state.recentViews.filter(id => !spotIds.includes(id));
    },
    editedOrCreatedSpot(state, action) {
      const modifiedSpot = {
        ...action.payload,
        properties: {...action.payload.properties, modified_timestamp: Date.now()},
      };
      state.spots = {...state.spots, [modifiedSpot.properties.id]: modifiedSpot};
      console.log('UPDATED Spot:', modifiedSpot, 'in Existing Spots:', state.spots);
      if (isEmpty(state.selectedSpot)) {
        state.selectedSpot = modifiedSpot;
        console.log('ADDED NEW Selected Spot:', state.selectedSpot);
      }
      else if (state.selectedSpot.properties.id === modifiedSpot.properties.id) {
        state.selectedSpot = modifiedSpot;
        console.log('UPDATED Selected Spot:', state.selectedSpot);
      }
    },
    editedOrCreatedSpots(state, action) {
      const spotsWithTimestamp = action.payload.map(s => (
        {...s, properties: {...s.properties, modified_timestamp: Date.now()}}
      ));
      const spots = Object.assign({}, ...spotsWithTimestamp.map(spot => ({[spot.properties.id]: spot})));
      state.spots = {...state.spots, ...spots};
      console.log('UPDATED Spots:', state.spots, 'in Existing Spots:', current(state));
      if (!isEmpty(state.selectedSpot) && Object.keys(spots).includes(state.selectedSpot.properties.id)) {
        state.selectedSpot = spots[state.selectedSpot.properties.id];
        console.log('UPDATED Selected Spot:', state.selectedSpot);
      }
    },
    editedSpotImage(state, action) {
      const foundSpot = Object.values(state.spots).find((spot) => {
        return spot.properties.images && spot.properties.images.find(image => image.id === action.payload.id);
      });
      if (foundSpot) {
        const imagesFiltered = foundSpot.properties.images.filter(image => image.id !== action.payload.id);
        imagesFiltered.push(action.payload);
        foundSpot.properties.images = imagesFiltered;
        const selectedSpotCopy = isEmpty(state.selectedSpot)
        || state.selectedSpot.properties.id === foundSpot.properties.id ? foundSpot : state.selectedSpot;
        console.log('Edit Image for selectedSpot', selectedSpotCopy);
        state.selectedSpot = selectedSpotCopy;
        state.selectedSpot.properties.modified_timestamp = Date.now();
        state.spots = {...state.spots, [foundSpot.properties.id]: foundSpot};
      }
    },
    editedSpotImages(state, action) {
      let tempImages = [];
      if (state.selectedSpot.properties.images) tempImages = state.selectedSpot.properties.images;
      const updatedSpotObj = action.payload.map((image) => {
        return {id: image.id, height: image.height, width: image.width, image_type: image.image_type};
      });
      tempImages = [...tempImages, ...updatedSpotObj];
      const tempImagesWithTitles = tempImages.map((image, i) => {
        return {...image, title: isEmpty(image.title) ? 'Untitled ' + (i + 1) : image.title.toString()};
      });
      state.selectedSpot.properties.images = tempImagesWithTitles;
      state.selectedSpot.properties.modified_timestamp = Date.now();
      state.spots = {...state.spots, [state.selectedSpot.properties.id]: state.selectedSpot};
    },
    editedSpotProperties(state, action) {
      const {field, value, spotId = state.selectedSpot.properties.id} = action.payload;
      const spotToEdit = state.spots[spotId];
      spotToEdit.properties[field] = value;
      spotToEdit.properties.modified_timestamp = Date.now();
      if (field === 'notes') spotToEdit.properties.notesTimestamp = Date();
      if (spotId.toString() === state?.selectedSpot?.properties?.id.toString()) state.selectedSpot = spotToEdit;
      state.spots = {...state.spots, [spotId]: spotToEdit};
    },
    resetSpotState() {
      return initialSpotState;
    },
    setIntersectedSpotsForTagging(state, action) {
      state.intersectedSpotsForTagging = action.payload;
    },
    setSelectedAttributes(state, action) {
      state.selectedAttributes = action.payload;
    },
    setSelectedSpot(state, action) {
      let spotToSelect = action.payload;
      let recentViewsArr = Object.assign([], state.recentViews);
      const index = recentViewsArr.indexOf(spotToSelect.properties.id);
      if (index !== -1) recentViewsArr.splice(index, 1);
      recentViewsArr.unshift(spotToSelect.properties.id);
      if (state.recentViews.length > 20) recentViewsArr.shift();
      state.selectedSpot = spotToSelect;
      state.recentViews = recentViewsArr;
      state.selectedAttributes = [];
    },
  },
});

export const {
  addedSpotsFromDevice,
  addedSpotsFromServer,
  clearedSelectedSpots,
  clearedSpots,
  deletedSpot,
  deletedSpots,
  editedOrCreatedSpot,
  editedOrCreatedSpots,
  editedSpotImage,
  editedSpotImages,
  editedSpotProperties,
  resetSpotState,
  setIntersectedSpotsForTagging,
  setSelectedAttributes,
  setSelectedSpot,
} = spotSlice.actions;

export default spotSlice.reducer;
