import React from 'react';
import {FlatList, Platform} from 'react-native';

import DrawGeometryToggles from './DrawGeometryToggles';
import ShortcutsList from './ShortcutsList';

const AddingNewSpots = () => {
  return (
    <FlatList
      ListHeaderComponent={
        <>
          <ShortcutsList/>
          {Platform.OS !== 'web' && <DrawGeometryToggles/>}
        </>
      }
    />
  );
};

export default AddingNewSpots;
