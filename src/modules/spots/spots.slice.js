import {createSlice, current} from '@reduxjs/toolkit';

import {getUniqueTitle, isEmpty} from '../../shared/helpers';

// The placeholder editedSpotImages gives an image that arrives with no title of its own
const UNTITLED_TITLE = /^Untitled \d+$/;

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
      // Merge each downloaded spot in by id, overwriting the local copy.
      action.payload.forEach((spot) => {
        state.spots[spot.properties.id] = spot;
      });
      // If the currently selected spot was among those refreshed (e.g. keeping the server copy on a
      // conflict), update it too so the open view shows the new server data instead of the stale copy.
      if (!isEmpty(state.selectedSpot)) {
        const refreshedSpot = action.payload.find(
          spot => spot.properties.id === state.selectedSpot.properties.id,
        );
        if (refreshedSpot) state.selectedSpot = refreshedSpot;
      }
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
      // An image saved again under an id the Spot already has replaces the one there rather than joining it.
      // Two of an id is a duplicate the server refuses the whole Spot for, leaving it unable to save at all.
      const updatedIds = action.payload.map(image => image.id);
      let tempImages = (state.selectedSpot.properties.images || []).filter(
        image => !updatedIds.includes(image.id));
      // Updated as titles are assigned, so images added together cannot collide either
      const takenTitles = tempImages.map(image => image.title).filter(title => !isEmpty(title));
      const updatedSpotObj = action.payload.map((image) => {
        // A copy of an untitled image falls through to the backfill instead of inheriting the
        // placeholder it was copied from as "Untitled 1 (2)"
        const isPlaceholder = !isEmpty(image.title) && UNTITLED_TITLE.test(image.title);
        const title = isEmpty(image.title) || isPlaceholder ? undefined
          : getUniqueTitle(image.title, takenTitles);
        if (!isEmpty(title)) takenTitles.push(title);
        return {
          id: image.id,
          height: image.height,
          width: image.width,
          image_type: image.image_type,
          ...(!isEmpty(title) && {title: title}),
          ...(!isEmpty(image.view_angle_plunge) && {view_angle_plunge: image.view_angle_plunge}),
          ...(!isEmpty(image.view_azimuth_trend) && {view_azimuth_trend: image.view_azimuth_trend}),
        };
      });
      tempImages = [...tempImages, ...updatedSpotObj];
      // Lowest free slot rather than the array index, so an image deliberately titled "Untitled 2"
      // cannot collide with the backfill
      let untitledNumber = 1;
      const tempImagesWithTitles = tempImages.map((image) => {
        if (!isEmpty(image.title)) return {...image, title: image.title.toString()};
        while (takenTitles.includes('Untitled ' + untitledNumber)) untitledNumber++;
        takenTitles.push('Untitled ' + untitledNumber);
        return {...image, title: 'Untitled ' + untitledNumber};
      });
      state.selectedSpot.properties.images = tempImagesWithTitles;
      state.selectedSpot.properties.modified_timestamp = Date.now();
      state.spots = {...state.spots, [state.selectedSpot.properties.id]: state.selectedSpot};
    },
    editedSpotProperties(state, action) {
      const {field, value, spotId = state.selectedSpot?.properties?.id} = action.payload;
      if (spotId) {
        const spotToEdit = state.spots[spotId];
        if (isEmpty(value)) delete spotToEdit.properties[field];
        else spotToEdit.properties[field] = value;
        spotToEdit.properties.modified_timestamp = Date.now();
        if (field === 'notes') spotToEdit.properties.notesTimestamp = Date();
        if (spotId.toString() === state?.selectedSpot?.properties?.id.toString()) state.selectedSpot = spotToEdit;
        state.spots = {...state.spots, [spotId]: spotToEdit};
      }
      else throw Error('Missing Spot Id');
    },
    resetSpotState() {
      return initialSpotState;
    },
    restoredIntervalDragSnapshot(state, action) {
      const spots = Object.assign({}, ...action.payload.map(spot => ({[spot.properties.id]: spot})));
      state.spots = {...state.spots, ...spots};
      if (!isEmpty(state.selectedSpot) && Object.keys(spots).includes(state.selectedSpot?.properties?.id)) {
        state.selectedSpot = spots[state.selectedSpot.properties.id];
      }
    },
    restoredSpots(state, action) {
      // Re-add previously deleted Spots (undo delete) by merging them back in without touching other Spots.
      state.spots = {...state.spots, ...action.payload};
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
  restoredIntervalDragSnapshot,
  restoredSpots,
  setIntersectedSpotsForTagging,
  setSelectedAttributes,
  setSelectedSpot,
} = spotSlice.actions;

export default spotSlice.reducer;
