import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import {Button, Icon, Overlay} from '@rn-vui/base';
import Pdf from 'react-native-pdf';
import {useToast} from 'react-native-toast-notifications';

import useDevice from '../../services/useDevice';
import {isEmpty, openUrl} from '../../shared/Helpers';
import {BLACK, POSITIVE_COLOR, WARNING_COLOR, WHITE} from '../../shared/styles.constants';
import overlayStyles from '../home/overlays/overlay.styles';

const MicroProjectPDFOverlay = ({doc, setVisible, visible}) => {
  const {exportMicroProjectPDF} = useDevice();
  const toast = useToast();

  const [wasExported, setWasExported] = useState(false);
  const [isExportError, setIsExportError] = useState(false);

  useEffect(() => {
    setWasExported(false);
    setIsExportError(false);
  }, [visible]);

  const handleExport = async () => {
    try {
      await exportMicroProjectPDF(doc);
      console.log('Done Exporting Project');
      toast.show('PDF Exported to Device!', {type: 'success'});
      setWasExported(true);
    }
    catch (e) {
      console.error('Error Exporting Project', e);
      toast.show('Error Exporting PDF Device!', {type: 'danger'});
      setIsExportError(true);
    }
  };

  return (
    <Overlay
      supportedOrientations={['portrait', 'landscape']}
      isVisible={visible}
      overlayStyle={{height: '100%', width: '100%', backgroundColor: WHITE}}
    >
      <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
        {wasExported ? (
          <Icon
            name={'check-circle-outline'}
            type={'material-community'}
            size={25}
            color={POSITIVE_COLOR}
            containerStyle={overlayStyles.closeButton}
          />
        ) : isExportError ? (
          <Icon
            name={'alert-circle-outline'}
            type={'material-community'}
            size={25}
            color={WARNING_COLOR}
            containerStyle={overlayStyles.closeButton}
          />
        ) : (
          <Icon
            name={'export'}
            type={'material-community'}
            size={25}
            color={BLACK}
            onPress={handleExport}
            containerStyle={overlayStyles.closeButton}
          />
        )}
        <Button
          type={'clear'}
          onPress={() => setVisible(!visible)}
          icon={
            <Icon
              name={'close-outline'}
              type={'ionicon'}
              size={30}
              color={BLACK}
            />
          }
        />
      </View>
      {!isEmpty(doc) && (
        <Pdf
          source={doc.file}
          style={{flex: 1}}
          onLoadComplete={(numberOfPages, filePath) => {
            console.log(`Number of pages: ${numberOfPages}`);
          }}
          onError={(error) => {
            console.log(error);
          }}
          onPressLink={async (uri) => {
            console.log(`Link pressed: ${uri}`);
            await openUrl(uri);
          }}
        />
      )}
    </Overlay>
  );
};

export default MicroProjectPDFOverlay;
