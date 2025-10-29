import {StyleSheet} from 'react-native';

import * as themes from '../../styles.constants';

const modalStyles = StyleSheet.create({
  modalHeaderButtonsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginLeft: 10,
  },
  modalHeaderContainer: {
    flex: 1,
    flexDirection: 'column',
    padding: 10,
    paddingTop: 5,
  },
  modalTitle: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalTop: {
    alignItems: 'center',
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderRadius: themes.MODAL_BORDER_RADIUS,
    flexDirection: 'row',
  },
  textContainer: {
    alignItems: 'center',
  },
  textStyle: {
    color: themes.WARNING_COLOR,
    fontSize: themes.MODAL_TEXT_SIZE,
    textAlign: 'center',
  },
});

export default modalStyles;
