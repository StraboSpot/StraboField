import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';
import {MEDIUM_TEXT_SIZE, SECONDARY_BACKGROUND_COLOR} from '../../shared/styles.constants';

const imageStyles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: SECONDARY_BACKGROUND_COLOR,
    borderColor: 'grey',
    borderWidth: 1,
    margin: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  cardContainer: {
    borderBottomColor: themes.LIST_BORDER_COLOR,
    borderWidth: 1,
    margin: 2,
    padding: 0,
  },
  cardImageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 0,
    padding: 0,
  },
  cardTitle: {
    flex: 1,
    fontSize: MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    paddingVertical: 5,
    textAlign: 'center',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cardTitleEditingButton: {
    alignItems: 'center',
    flex: 1,
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
  imageInfoButtons: {
    marginTop: 20,
  },
  imagesListContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2.5,
  },
  placeholderImage: {
    alignSelf: 'center',
    backgroundColor: SECONDARY_BACKGROUND_COLOR,
    flex: 1,
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
  thumbnailImageContainer: {
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
  },
});

export default imageStyles;
