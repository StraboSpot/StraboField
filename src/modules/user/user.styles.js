import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const UserStyles = StyleSheet.create({
  avatarLabelContainer: {
    justifyContent: 'space-around',
    padding: 10,
  },
  avatarLabelEmail: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatarLabelName: {
    fontSize: themes.PRIMARY_TEXT_SIZE,
    fontWeight: 'bold',
    paddingBottom: 5,
  },
  avatarPlaceholderTitleStyle: {
    color: themes.PRIMARY_TEXT_COLOR,
  },
  deleteProfileButtonContainer: {
    marginBottom: 15,
  },
  deleteProfileButtonText: {
    color: themes.RED,
  },
  deleteProfileText: {
    fontWeight: '600',
    lineHeight: 25,
    paddingBottom: 20,
    paddingTop: 10,
    textAlign: 'center',
  },
  imageSelectionModal: {
    borderRadius: 20,
    padding: 20,
    width: 300,
  },
  initialProjectLoadProfileContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 10,
  },
  initialProjectLoadProfileHeaderContainer: {
    alignItems: 'center',
  },
  initialProjectLoadProfileHeaderText: {
    fontSize: themes.LARGE_TEXT_SIZE,
    paddingTop: 10
  },
  initialProjectLoadProfileSubHeaderText: {
    fontSize: 10,
  },
  loadingSpinnerProps: {
    color: '#999999',
    size: 'large',
  },
  profileNameAndImageContainer: {
    alignItems: 'center',
    backgroundColor: themes.SECONDARY_BACKGROUND_COLOR,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 10,
  },
  profilePageAvatarContainer: {
    borderColor: 'white',
    borderWidth: 7,
  },
  saveButtonContainer: {
    paddingVertical: 20,
  },
});

export default UserStyles;
