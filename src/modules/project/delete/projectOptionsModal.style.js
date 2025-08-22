import {StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';

const projectOptionsModalStyle = StyleSheet.create({
  backupViewInputHeaderText: {
    fontSize: 12,
    padding: 5,
    textAlign: 'center',
  },
  deleteButtonText: {
    color: 'red',
  },
  errorText: {
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: themes.PRIMARY_BACKGROUND_COLOR,
    borderRadius: 20,
    maxHeight: '90%',
    position: 'absolute',
    top: '10%',
    width: 300,
  },
  projectNameText: {
    fontWeight: 'bold',
  },
  sectionViewButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 10,
  },
});

export default projectOptionsModalStyle;
