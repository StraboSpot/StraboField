import {createContext} from 'react';

// The point MacrostratUnitInfo describes, undefined while it is closed. Shared from HomeContainer because the map
// handles the press, but the home screen draws the unit info so it can sit over its buttons.
export const MacrostratContext = createContext(null);
