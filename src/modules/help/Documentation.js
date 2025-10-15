import React, {useState} from 'react';
import {FlatList, Platform, View} from 'react-native';

import documentationStyles from './documentation.styles';
import SpotDataModelModal from './SpotDataModelModal';
import UrlLinkButton from './UrlLinkButton';
import {STRABO_APIS} from '../../services/urls.constants';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';

const Documentation = ({navigation}) => {
  const [isSpotDataModelModalVisible, setIsSpotDataModelModalVisible] = useState(false);

  const files = [
    {
      id: 1,
      platform: ['ios'],
      label: 'airdrop',
      name: 'How to Airdrop backup files to other iPads',
      file: require('../../assets/documents/Airdrop-from-iPad-to-iPad.pdf'),
    },
    {
      id: 2,
      platform: ['ios'],
      label: 'moveFiles',
      name: 'Moving backups out of StraboSpot 2 folder ',
      file: Platform.OS === 'ios' && require('../../assets/documents/MovingProjectBackupsOutOfStraboSpot2.pdf'),
    },
    {
      id: 3,
      platform: ['ios', 'android'],
      label: 'helpDocument',
      name: 'Help Guide',
      file:
        Platform.OS === 'ios' ? require('../../assets/documents/Strabo_Help_Guide.pdf')
          : {uri: 'bundle-assets://Strabo_Help_Guide.pdf'},
    },
  ];

  const handlePress = (document) => {
    navigation.navigate('DocumentationScreen', {document});
  };


  const renderFAQList = () => {
    let filteredDocs = [];
    files.forEach((file) => {
      if (Platform.OS === 'ios' && file.platform.includes('ios')) {
        filteredDocs.push(file);
      }
      else if (
        Platform.OS === 'android'
        && file.platform.includes('android')
      ) {
        filteredDocs.push(file);
      }
    });
    console.log(filteredDocs);

    return (
      <View>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          data={filteredDocs}
          keyExtractor={item => item.id}
          renderItem={({item}) => renderFAQListItem(item)}
        />
      </View>
    );
  };

  const renderFAQListItem = item => (
    <OutlineButton
      onPress={() => handlePress(item)}
      title={item.name}
    />
  );


  return (
    <>
      <View style={documentationStyles.container}>
        <UrlLinkButton
          icon={'globe-outline'}
          title={'Online Help Page'}
          url={STRABO_APIS.STRABO + '/help'}
        />
        {renderFAQList()}
        <OutlineButton
          onPress={() => setIsSpotDataModelModalVisible(true)}
          title={'Spot Data Model'}
        />
      </View>

      {/* Modals */}
      {isSpotDataModelModalVisible && <SpotDataModelModal close={() => setIsSpotDataModelModalVisible(false)}/>}
    </>
  );
};

export default Documentation;
