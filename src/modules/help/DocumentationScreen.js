import React, {useRef, useState} from 'react';
import {View} from 'react-native';

import Pdf from 'react-native-pdf';

import documentationStyles from './documentation.styles';
import DocumentationModalHeader from './DocumentationModalHeader';
import {isEmpty, openUrl} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';

const DocumentationScreen = ({route, navigation}) => {
  /* Local State */

  const ref = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* Derived Variables */

  const {document} = route.params;

  /* Logic Helpers */

  const goBack = () => navigation.goBack();

  const openLink = async (url) => {
    try {
      await openUrl(url);
    }
    catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  /* View */

  return (
    <View style={documentationStyles.viewerContainer}>
      <DocumentationModalHeader
        currentPage={currentPage}
        onClose={goBack}
        onJumpToPage={page => ref.current.setPage(page)}
        totalPages={totalPages}
      />
      {!isEmpty(document) && (
        <Pdf
          onError={error => console.log(error)}
          onLoadComplete={numberOfPages => setTotalPages(numberOfPages)}
          onPageChanged={(page, numberOfPages) => {
            setCurrentPage(page);
            console.log(`Number of pages: ${page}/${numberOfPages}`);
          }}
          onPressLink={openLink}
          ref={ref}
          source={document.file}
          style={documentationStyles.pdf}
        />
      )}
    </View>
  );
};

export default DocumentationScreen;
