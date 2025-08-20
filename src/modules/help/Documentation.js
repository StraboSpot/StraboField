import React, {useRef, useState} from 'react';
import {FlatList, Platform, View} from 'react-native';

import {Button, ListItem, Overlay} from '@rn-vui/base';
import Pdf from 'react-native-pdf';

import styles from './documentation.styles';
import DocumentationModalHeader from './DocumentationModalHeader';
import SpotDataModelModal from './SpotDataModelModal';
import {STRABO_APIS} from '../../services/urls.constants';
import commonStyles from '../../shared/common.styles';
import {isEmpty, openUrl} from '../../shared/Helpers';
import {WHITE} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import OpenUrlLink from '../../shared/ui/OpenUrlLink';
import SectionDivider from '../../shared/ui/SectionDivider';
import mainMenuPanelStyles from '../main-menu-panel/mainMenuPanel.styles';

const Documentation = () => {
  const ref = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [doc, setDoc] = useState('');
  const [isSpotDataModelModalVisible, setIsSpotDataModelModalVisible] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [visible, setVisible] = useState(false);

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
      name: 'Strabo Help Guide',
      file:
        Platform.OS === 'ios' ? require('../../assets/documents/Strabo_Help_Guide.pdf')
          : {uri: 'bundle-assets://Strabo_Help_Guide.pdf'},
    },
  ];

  const handlePress = (document) => {
    setDoc(document);
    setVisible(!visible);
  };

  const openLink = async (url) => {
    try {
      await openUrl(url);
    }
    catch (error) {
      console.error(error);
      alert(error.message);
    }
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
      <View style={{maxHeight: '80%'}}>
        <FlatList
          keyExtractor={item => item.id}
          data={filteredDocs}
          renderItem={({item}) => renderFAQListItem(item)}
          ItemSeparatorComponent={FlatListItemSeparator}
        />
      </View>
    );
  };

  const renderFAQListItem = item => (
    <ListItem
      onPress={() => handlePress(item)}
      containerStyle={mainMenuPanelStyles.documentListItem}
    >
      <ListItem.Content style={commonStyles.listItemContent}>
        <ListItem.Title style={commonStyles.listItemTitle}>
          {item.name}
        </ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron size={20}/>
    </ListItem>
  );

  const renderPDF = () => (
    <Overlay
      supportedOrientations={['portrait', 'landscape']}
      isVisible={visible}
      fullScreen
      overlayStyle={styles.overlayContainer}
    >
      <DocumentationModalHeader
        currentPage={currentPage}
        totalPages={totalPages}
        onClose={() => setVisible(false)}
        onJumpToPage={page => ref.current.setPage(page)}
      />
      {!isEmpty(doc) && (
        <Pdf
          ref={ref}
          source={doc.file}
          style={styles.pdf}
          onLoadComplete={(numberOfPages, filePath) => {
            setTotalPages(numberOfPages);
          }}
          onError={(error) => {
            console.log(error);
          }}
          onPressLink={openLink}
          onPageChanged={(page, numberOfPages) => {
            setCurrentPage(page);
            console.log(`Number of pages: ${page}/${numberOfPages}`);
          }}
        />
      )}
    </Overlay>
  );

  const renderSpotDataModelSection = () => {
    return (
      <>
        <SectionDivider dividerText={'Spot Data Model'}/>
        <Button
          title={'Show Data Model'}
          titleStyle={commonStyles.standardButtonText}
          type={'clear'}
          onPress={() => setIsSpotDataModelModalVisible(true)}
        />
        {isSpotDataModelModalVisible && <SpotDataModelModal close={() => setIsSpotDataModelModalVisible(false)}/>}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {renderSpotDataModelSection()}
      <View>
        <SectionDivider dividerText={'Manual'}/>
      </View>
      <OpenUrlLink
        buttonStyle={styles.button}
        title={'Strabo Spot Help'}
        titleStyle={styles.buttonText}
        url={STRABO_APIS.STRABO + '/help'}
        icon={'globe-outline'}
        color={WHITE}
      />
      <View>
        <SectionDivider dividerText={'Helpful Docs'}/>
      </View>
      {renderFAQList()}
      {renderPDF()}
    </View>
  );
};

export default Documentation;
