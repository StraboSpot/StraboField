import {StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';

const igsnStyles = StyleSheet.create({
  IGSNLogo: {
    height: 20,
    width: 20,
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  fieldRow: {
    alignItems: 'center',
    borderBottomColor: themes.LIST_BORDER_COLOR,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
  },
  fieldValueText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: '400',
  },
  labelColumn: {
    flex: 1.5, // Controls the width of the left side
  },
  labelText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    padding: 5,
  },
  valueColumn: {
    flex: 2, // Controls the width of the right side
    paddingLeft: 10,
  },
});

export default igsnStyles;
