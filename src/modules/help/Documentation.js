import React, {useState} from 'react';
import {Platform, ScrollView, View} from 'react-native';

import {useSelector} from 'react-redux';

import SpotDataModelModal from './SpotDataModelModal';
import UrlLinkButton from './UrlLinkButton';
import {STRABO_APIS} from '../../services/urls.constants';
import {BLACK, BLUE} from '../../shared/styles.constants';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import SectionDivider from '../../shared/ui/SectionDivider';

const Documentation = ({navigation}) => {
  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);

  const [isSpotDataModelModalVisible, setIsSpotDataModelModalVisible] = useState(false);

  const files = [
    {
      id: 1,
      platform: ['ios', 'android'],
      label: 'userGuide',
      name: 'User Guide',
      icon: 'book-outline',
      file: Platform.OS === 'ios'
        ? require('../../assets/documents/StraboField_User_Manual.pdf')
        : {uri: 'bundle-assets://StraboField_User_Manual.pdf'},
    },
    {
      id: 2,
      platform: ['ios', 'android'],
      label: 'sharingProjects',
      name: 'Sharing Projects \nBetween Devices',
      icon: 'share-outline',
      file: Platform.OS === 'ios'
        ? require('../../assets/documents/Updated_Sharing_Projects_Between_Devices.pdf')
        : {uri: 'bundle-assets://Updated_Sharing_Projects_Between_Devices.pdf'},
    },
    {
      id: 3,
      platform: ['ios', 'android'],
      label: 'moveFiles',
      name: 'Exporting Project \nBackups',
      icon: 'share-outline',
      file: Platform.OS === 'ios'
        ? require('../../assets/documents/Updated_Moving_StraboField_Project_Backups.pdf')
        : {uri: 'bundle-assets://Updated_Moving_StraboField_Project_Backups.pdf'},
    },
  ];

  const links = [
    {
      id: 1,
      title: 'Online Help Page',
      url: STRABO_APIS.STRABO + '/help',
      icon: 'globe-outline',
      color: BLUE,
    },
    {
      id: 2,
      title: 'YouTube Tutorials',
      url: 'https://youtube.com/playlist?list=PL3jEmSMv6rzHysg-mEVx_yhaXStgK8MV5&si=sv_i9YayDdv_LfYf',
      icon: 'logo-youtube',
      color: 'red',
    },
  ];

  const handlePress = (document) => {
    navigation.navigate('DocumentationScreen', {document});
  };

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
      onPress={() => handlePress(item)}
      title={item.name}
    />
  );

  const renderLinkButton = item => (
    <UrlLinkButton
      color={item.color}
      icon={item.icon}
      key={item.id}
      title={item.title}
      url={item.url}
    />
  );

  return (
    <View style={{flex: 1}}>
      <ScrollView style={{flex: 1}}>
        <SectionDivider dividerText={'PDF Guides'}/>
        <View>
          {files.map(renderDocumentButton)}
        </View>
        {isOnline && (
          <>
            <SectionDivider dividerText={'Online Resources'}/>
            <View>
              {links.map(renderLinkButton)}
            </View>
          </>
        )}
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
      </ScrollView>

      {isSpotDataModelModalVisible && <SpotDataModelModal close={() => setIsSpotDataModelModalVisible(false)}/>}
    </View>
  );
};

export default Documentation;
