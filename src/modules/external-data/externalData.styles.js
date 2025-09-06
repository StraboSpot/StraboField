import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const externalDataStyles = StyleSheet.create({
  cellText: {
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 6,
    textAlign: 'center',
  },
  iconContainer: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  listItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  loadingContainer: {
    backgroundColor: themes.PRIMARY_BACKGROUND_COLOR,
    borderRadius: 15,
    maxHeight: '20%',
    maxWidth: '20%',
  },
  loadingSpinner: {
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 50,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalText: {
    fontSize: themes.PRIMARY_HEADER_TEXT_SIZE,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalTitle: {
    color: '#222',
    flexShrink: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    padding: 35,
  },
  overlayContainer: {
    backgroundColor: themes.PRIMARY_BACKGROUND_COLOR,
    borderRadius: 15,
    maxHeight: '90%',
    maxWidth: '90%',
    padding: 16,
  },
});

export default externalDataStyles;
