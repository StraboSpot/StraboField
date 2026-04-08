import React, {useState} from 'react';
import {View} from 'react-native';

import SpotDataModelModal from './SpotDataModelModal';
import {BLACK} from '../../../shared/styles.constants';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import SectionDivider from '../../../shared/ui/SectionDivider';

const DeveloperResourcesSection = () => {
  /* Local State */

  const [isSpotDataModelModalVisible, setIsSpotDataModelModalVisible] = useState(false);

  /* View */

  return (
    <>
      <SectionDivider dividerText={'Developer Resources'}/>
      <View>
        <OutlineButton
          icon={{
            color: BLACK,
            iconStyle: {paddingRight: 10},
            name: 'code-slash-outline',
            size: 20,
            type: 'ionicon',
          }}
          iconContainerStyle={{position: 'absolute', left: 15}}
          onPress={() => setIsSpotDataModelModalVisible(true)}
          title={'Spot Data Model'}
        />
      </View>

      {isSpotDataModelModalVisible && <SpotDataModelModal close={() => setIsSpotDataModelModalVisible(false)}/>}
    </>
  );
};

export default DeveloperResourcesSection;