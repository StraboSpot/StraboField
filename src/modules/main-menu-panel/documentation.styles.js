import {Dimensions, StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';
import {BLUE, MEDIUM_TEXT_SIZE, WHITE} from '../../shared/styles.constants';

const documentationStyles = StyleSheet.create({
  activityIndicatorStyle: {
    flex: 1,
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: BLUE,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: WHITE,
    fontSize: MEDIUM_TEXT_SIZE,
  },
  bottomButton: {
    justifyContent: 'flex-end',
    margin: 20,
  },
  closeButton: {
    alignItems: 'flex-end',
    width: 24,
  },
  jumpButton: {
    paddingHorizontal: 8,
  },
  jumpText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  pageOption: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  pageOptionText: {
    fontSize: 16,
  },
  pickerOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: '50%',
    padding: 16,
    width: 200,
  },
  pickerCancelButtonContainer: {
    marginBottom: 8,
  },
  pageText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  overlayContainer: {
    alignItems: 'center',
    backgroundColor: themes.PRIMARY_BACKGROUND_COLOR,
    justifyContent: 'center',
  },
  pdf: {
    flex: 1,
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
  headerContainer: {
    alignItems: 'center',
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});

export default documentationStyles;
