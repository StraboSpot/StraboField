import React from 'react';
import {View} from 'react-native';

import ImportExportTagsModal from './ImportExportTagsModal';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import ClearButton from '../../shared/ui/buttons/ClearButton';

const ImportExportTags = ({isGeologicUnits}) => {

  const [importTagModalVisible, setImportTagModalVisible] = React.useState(false);
  const [exportTagModalVisible, setExportTagModalVisible] = React.useState(false);

  const action = importTagModalVisible ? 'Import' : 'Export';

  const handleClosePress = () => {
    setImportTagModalVisible(false);
    setExportTagModalVisible(false);
  };

  return (
    <>
      <View style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
        <ClearButton
          icon={{
            color: PRIMARY_ACCENT_COLOR,
            iconStyle: {paddingRight: 10},
            name: 'download-outline',
            size: 20,
            type: 'ionicon',
          }}
          onPress={() => setImportTagModalVisible(true)}
          title={'Import'}
        />
        <ClearButton
          icon={{
            color: PRIMARY_ACCENT_COLOR,
            iconStyle: {paddingRight: 10},
            name: 'share-outline',
            size: 20,
            type: 'ionicon',
          }}
          onPress={() => setExportTagModalVisible(true)}
          title={'Export'}
        />
      </View>

      {/* Modal */}
      {(importTagModalVisible || exportTagModalVisible) && (
        <ImportExportTagsModal action={action} closeModal={handleClosePress} isGeologicUnits={isGeologicUnits}/>
      )}
    </>
  );
};

export default ImportExportTags;
