import React from 'react';
import {View} from 'react-native';

import AddDatasetModal from './AddDatasetModal';
import DatasetList from './DatasetList';
import SectionDividerWithRightButton from '../../../shared/ui/SectionDividerWithRightButton';
import MainMenuPanelHeader from '../../main-menu-panel/MainMenuPanelHeader';

const DatasetsPage = ({isAddDatasetModalVisible, setIsAddDatasetModalVisible, setDatasetToView}) => {

  /* View */

  return (
    <>
      <View style={{flex: 1, flexDirection: 'column'}}>
        <MainMenuPanelHeader/>
        <SectionDividerWithRightButton
          disabled={true}
          dividerText={'Datasets'}
          onPress={() => setIsAddDatasetModalVisible(true)}
        />
        <DatasetList setDatasetToView={setDatasetToView}/>
      </View>

      {/* Modals */}
      <AddDatasetModal
        isAddDatasetModalVisible={isAddDatasetModalVisible}
        setIsAddDatasetModalVisible={setIsAddDatasetModalVisible}
      />
    </>
  );
};

export default DatasetsPage;
