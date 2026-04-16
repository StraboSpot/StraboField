import React from 'react';
import {Platform, View} from 'react-native';

import {BLACK} from '../../../shared/styles.constants';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import SectionDivider from '../../../shared/ui/SectionDivider';

const files = [
  {
    id: 1,
    label: 'userGuide',
    name: 'User Guide',
    icon: 'book-outline',
    file: Platform.OS === 'ios' ? require('../../../assets/documents/StraboField_User_Manual.pdf')
      : {uri: 'bundle-assets://StraboField_User_Manual.pdf'},
  },
  {
    id: 2,
    label: 'sharingProjects',
    name: 'Sharing Projects \nBetween Devices',
    icon: 'arrow-redo-outline',
    file: Platform.OS === 'ios' ? require('../../../assets/documents/Sharing_Projects_Between_Devices.pdf')
      : {uri: 'bundle-assets://Sharing_Projects_Between_Devices.pdf'},
  },
  {
    id: 3,
    label: 'moveFiles',
    name: 'Moving Project Backups\nOut of StraboField',
    icon: 'share-outline',
    file: Platform.OS === 'ios' ? require('../../../assets/documents/Moving_StraboField_Project_Backups.pdf')
      : {uri: 'bundle-assets://Moving_StraboField_Project_Backups.pdf'},
  },
  {
    id: 4,
    label: 'offline',
    name: 'StraboField Offline',
    icon: 'cloud-offline-outline',
    file: Platform.OS === 'ios' ? require('../../../assets/documents/StraboField_Offline.pdf')
      : {uri: 'bundle-assets://StraboField_Offline.pdf'},
  },
];

const PdfGuidesSection = ({onPress}) => {
  const renderDocumentButton = item => (
    <OutlineButton
      icon={{
        color: BLACK,
        iconStyle: {paddingRight: 10},
        name: item.icon,
        size: 20,
        type: 'ionicon',
      }}
      iconContainerStyle={{position: 'absolute', left: 15}}
      key={item.id}
      onPress={() => onPress(item)}
      title={item.name}
    />
  );

  return (
    <>
      <SectionDivider dividerText={'Offline Resources'}/>
      <View>
        {files.map(renderDocumentButton)}
      </View>
    </>
  );
};

export default PdfGuidesSection;