import React from 'react';
import {Text, View} from 'react-native';

import AddDatasetModal from './AddDatasetModal';
import DatasetList from './DatasetList';
import commonStyles from '../../../shared/common.styles';
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
        <View style={{justifyContent: 'flex-start', alignItems: 'center', padding: 10}}>
          <Text style={commonStyles.standardDescriptionText}>
            *Starred dataset will be set as the target dataset for new Spots.
          </Text>
        </View>
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
