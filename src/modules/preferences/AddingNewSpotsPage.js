import React from 'react';
import {FlatList, Platform} from 'react-native';

import DrawGeometryToggles from './DrawGeometryToggles';
import ShortcutsList from './ShortcutsList';

const AddingNewSpotsPage = () => {
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

export default AddingNewSpotsPage;
