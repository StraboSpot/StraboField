import {StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';

const IGSNModalStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
  requiredLabel: {
    color: themes.WARNING_COLOR,
    fontSize: themes.SMALL_TEXT_SIZE,
    fontStyle: 'italic',
    margin: 20,
    textAlign: 'center',
  },
  sesarAuthText: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 50,
    textAlign: 'left',
  },
  sesarImage: {
    borderWidth: 2,
    height: 100,
    width: 275,
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
