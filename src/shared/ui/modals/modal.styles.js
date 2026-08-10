import {StyleSheet} from 'react-native';

import * as themes from '../../styles.constants';

// Shared by the JSON tree modals (raw Spot data, Spot data model). 40% reads well on a desktop but is too narrow
// on a tablet in portrait, so minWidth holds a readable floor and maxWidth keeps a margin at the narrowest sizes.
// With isChildrenFilled, maxHeight becomes a fixed height on open so expanding a node can't resize the modal.
export const JSON_MODAL_STYLE = {maxHeight: '80%', maxWidth: '90%', minWidth: 600, width: '40%'};

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
  modalHeaderImage: {
    alignItems: 'center',
    height: 60,
    width: 60,
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
