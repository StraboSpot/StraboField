import React, {useRef, useState} from 'react';
import {FlatList, Platform, View} from 'react-native';

import {Overlay} from '@rn-vui/base';
import Pdf from 'react-native-pdf';

import documentationStyles from './documentation.styles';
import DocumentationModalHeader from './DocumentationModalHeader';
import SpotDataModelModal from './SpotDataModelModal';
import UrlLinkButton from './UrlLinkButton';
import {STRABO_APIS} from '../../services/urls.constants';
import {isEmpty, openUrl} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';

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
      name: 'Help Guide',
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

  const renderPDF = () => (
    <Overlay
      fullScreen
      isVisible={visible}
      overlayStyle={documentationStyles.overlayContainer}
      supportedOrientations={['portrait', 'landscape']}
    >
      <DocumentationModalHeader
        currentPage={currentPage}
        onClose={() => setVisible(false)}
        onJumpToPage={page => ref.current.setPage(page)}
        totalPages={totalPages}
      />
      {!isEmpty(doc) && (
        <Pdf
          onError={(error) => {
            console.log(error);
          }}
          onLoadComplete={(numberOfPages, filePath) => {
            setTotalPages(numberOfPages);
          }}
          onPageChanged={(page, numberOfPages) => {
            setCurrentPage(page);
            console.log(`Number of pages: ${page}/${numberOfPages}`);
          }}
          onPressLink={openLink}
          ref={ref}
          source={doc.file}
          style={documentationStyles.pdf}
        />
      )}
    </Overlay>
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
      {renderPDF()}
      {isSpotDataModelModalVisible && <SpotDataModelModal close={() => setIsSpotDataModelModalVisible(false)}/>}
    </>
  );
};

export default Documentation;
