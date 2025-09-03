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
      isVisible={visible}
      overlayStyle={{height: '100%', width: '100%', backgroundColor: WHITE}}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
        {wasExported ? (
          <Icon
            color={POSITIVE_COLOR}
            containerStyle={overlayStyles.closeButton}
            name={'check-circle-outline'}
            size={25}
            type={'material-community'}
          />
        ) : isExportError ? (
          <Icon
            color={WARNING_COLOR}
            containerStyle={overlayStyles.closeButton}
            name={'alert-circle-outline'}
            size={25}
            type={'material-community'}
          />
        ) : (
          <Icon
            color={BLACK}
            containerStyle={overlayStyles.closeButton}
            name={'export'}
            onPress={handleExport}
            size={25}
            type={'material-community'}
          />
        )}
        <Button
          icon={
            <Icon
              color={BLACK}
              name={'close-outline'}
              size={30}
              type={'ionicon'}
            />
          }
          onPress={() => setVisible(!visible)}
          type={'clear'}
        />
      </View>
      {!isEmpty(doc) && (
        <Pdf
          onError={(error) => {
            console.log(error);
          }}
          onLoadComplete={(numberOfPages, filePath) => {
            console.log(`Number of pages: ${numberOfPages}`);
          }}
          onPressLink={async (uri) => {
            console.log(`Link pressed: ${uri}`);
            await openUrl(uri);
          }}
          source={doc.file}
          style={{flex: 1}}
        />
      )}
    </Overlay>
  );
};

export default MicroProjectPDFOverlay;
