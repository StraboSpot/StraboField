import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';
import {MEDIUM_TEXT_SIZE} from '../../shared/styles.constants';

const imageStyles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: 'white',
    borderColor: 'grey',
    borderWidth: 1,
    margin: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  cardContainer: {
    margin: 5,
    padding: 0,
  },
  cardImageContainer: {
    alignSelf: 'center',
    height: 150,
    padding: 5,
    width: 150,
  },
  cardTitle: {
    fontSize: MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    paddingVertical: 5,
    textAlign: 'center',
  },
  closeButtonContainer: {
    position: 'absolute',
    right: 20,
    top: 40,
  },
  closeButtonStyle: {
    height: 40,
    width: 40,
  },
  galleryImageContainer: {
    flex: 1,
  },
  icon: {
    paddingRight: 10,
  },
  imageContainer: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    borderBottomColor: themes.LIST_BORDER_COLOR,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
  },
  imageInfoButtons: {
    marginTop: 20,
  },
  notebookImage: {
    height: 100,
    width: 145,
  },
  rightsideIcons: {
    bottom: 50,
    position: 'absolute',
    right: 10,
  },
  switch: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  thumbnail: {
    height: 90,
    width: 90,
  },
  thumbnailContainer: {
    margin: 5,
    width: 90,
  },
});

export default imageStyles;
