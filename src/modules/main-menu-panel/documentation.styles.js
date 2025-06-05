import {Dimensions, StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';
import {BLUE, MEDIUM_TEXT_SIZE, PRIMARY_BACKGROUND_COLOR, WHITE} from '../../shared/styles.constants';

const documentationStyles = StyleSheet.create({
  activityIndicatorStyle: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomButton: {
    justifyContent: 'flex-end',
    margin: 20,
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
  closeButton: {
    alignItems: 'flex-end',
    width: 24,
  },
  container: {
    flex: 1,
    padding: 20,
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
  jumpButton: {
    paddingHorizontal: 8,
  },
  jumpText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  overlayContainer: {
    alignItems: 'center',
    backgroundColor: themes.PRIMARY_BACKGROUND_COLOR,
    justifyContent: 'center',
  },
  pageOption: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  pageOptionText: {
    fontSize: 16,
  },
  pageText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  pdf: {
    flex: 1,
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
  pickerCancelButtonContainer: {
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: '50%',
    padding: 16,
    width: 200,
  },
  pickerOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default documentationStyles;
