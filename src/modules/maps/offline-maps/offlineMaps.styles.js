import {StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';

const styles = StyleSheet.create({
  button: {
    borderRadius: 30,
    paddingLeft: 50,
    paddingRight: 50,
  },
  buttonContainer: {
    marginTop: 10,
    padding: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
  },
  dialogTitle: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 10,
    paddingTop: 30,
  },
  itemContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  itemSubContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  itemSubTextStyle: {
    fontSize: 10,
  },
  itemTextStyle: {
    fontSize: themes.PRIMARY_TEXT_SIZE,
  },
  modalButtonText: {
    paddingLeft: 10,
    paddingRight: 15,
  },
});

export default styles;
