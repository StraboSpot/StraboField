import {setNotebookPageVisible} from './notebook.slice';
import {setSelectedAttributes} from '../spots/spots.slice';

// Open a feature's detail page from a list somewhere else - the Spot Overview, a tag's features, a measurement
// just taken. The page has to be set before the feature: leaving a page drops whatever it had selected (see
// spots.slice), so selecting first would only have the page change clear it again. React batches the two into
// one render, so the page never flashes its list on the way to the detail view.
export const openFeatureInNotebook = (dispatch, pageKey, feature) => {
  dispatch(setNotebookPageVisible(pageKey));
  dispatch(setSelectedAttributes([feature]));
};
