import {Dimensions, StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const IGSNModalStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',

    maxHeight: Dimensions.get('window').height,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  errorMessageText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fieldValueText: {
    fontWeight: '500',
  },
  headerText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    margin: 10,
  },
  sesarAuthText: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 50,
    textAlign: 'left',
  },
  sesarImage: {
    borderWidth: 2,
    height: 120,
    width: 340,
  },
  sesarImageContainer: {
    alignContent: 'center',
    backgroundColor: 'rgb(164, 200, 209)',
    justifyContent: 'center',
  },
  uploadContentDescription: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    margin: 30,
    textAlign: 'center',
  },
  uploadContentText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    padding: 5,
  },
});

export default IGSNModalStyles;
