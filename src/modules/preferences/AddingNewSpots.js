import React from 'react';
import {FlatList} from 'react-native';

import DrawGeometryToggles from './DrawGeometryToggles';
import ShortcutsList from './ShortcutsList';
import SnapToSpots from './SnapToSpots';

const AddingNewSpots = () => {
  return (
    <FlatList
      ListHeaderComponent={
        <>
          <ShortcutsList/>
          <DrawGeometryToggles/>
          <SnapToSpots/>
        </>
      }
    />
  );
};

export default AddingNewSpots;
