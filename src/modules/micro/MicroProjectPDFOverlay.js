import React, {useEffect, useRef, useState} from 'react';
import {Platform, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import Pdf from 'react-native-pdf';
import Toast from 'react-native-toast-notifications';

import useDevice from '../../services/useDevice';
import {isEmpty, openUrl} from '../../shared/Helpers';
import {BLACK, POSITIVE_COLOR, WARNING_COLOR} from '../../shared/styles.constants';
import CloseButton from '../../shared/ui/buttons/CloseButton';
import Loading from '../../shared/ui/Loading';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import {useWindowSize} from '../../shared/ui/useWindowSize';

const MicroProjectPDFOverlay = ({doc, setVisible, visible}) => {
  /* Data Hooks */

  const {exportMicroProjectPDF} = useDevice();
  const {height, width} = useWindowSize();

  /* Local State */

  // const toast = useToast();
  const toastRef = useRef(null);

  const [isExportError, setIsExportError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wasExported, setWasExported] = useState(false);

  /* Side Effects */

  useEffect(() => {
    setWasExported(false);
    setIsExportError(false);
  }, [visible]);

  /* Event Handlers */

  const handleExport = async () => {
    try {
      setLoading(true);
      await exportMicroProjectPDF(doc);
      console.log('Done Exporting Project');
      showToast('PDF Exported to Device!', 'success');
      setWasExported(true);
      setLoading(false);
    }
    catch (e) {
      console.error('Error Exporting Project', e);
      showToast('Error Exporting PDF to Device!', 'danger');
      setIsExportError(true);
      setLoading(false);
    }
  };

  /* Logic Helpers */

  const showToast = (message, type) => {
    const toastOptions = {
      type: type,
      placement: 'top',
      duration: 2000,
    };
    // Fallback to alert on web since react-native-toast-notifications may not work
    if (Platform.OS === 'web') alert(message);
    else toastRef.current.show(message, toastOptions);
  };

  /* View */

  return (
    <ModalWrapper
      fullscreen
      isVisible={visible}
      showActionButton={false}
      showCancelButton={false}
    >
      <>
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
          <CloseButton onPress={() => setVisible(!visible)}/>
        </View>
        {!isEmpty(doc) && (
          <Pdf
            enablePaging
            maxScale={3}
            onError={error => console.log(error)}
            onLoadComplete={numberOfPages => console.log(`Number of pages: ${numberOfPages}`)}
            onPressLink={async (uri) => {
              console.log(`Link pressed: ${uri}`);
              await openUrl(uri);
            }}
            source={doc.file}
            style={{width, height: height - 100}}
          />
        )}
        <Loading isLoading={loading} style={{backgroundColor: 'transparent'}}/>
        <Toast ref={toastRef}/>
      </>
    </ModalWrapper>
  );
};

export default MicroProjectPDFOverlay;
