import {StyleSheet} from 'react-native';

import {DARKGREY} from '../../../shared/styles.constants';

const projectModalStyle = StyleSheet.create({
  gridItem: {
    // borderWidth: 1,
    alignItems: 'center',
    borderColor: DARKGREY,
    borderRadius: 15,
    height: 75, // Set height of each grid item
    justifyContent: 'center',
    margin: '1.5%', // To add space between grid items
    width: '30%', // Width of each item (a bit less than 33.33% to leave space between)
  },
  imageTotalUploadContainer: {
    padding: 10,
  },
  imageUploadingProgressContainer: {
    padding: 10,
  },
  messageContainer: {
    padding: 10,
  },
  messageText: {
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});

export default projectModalStyle;
