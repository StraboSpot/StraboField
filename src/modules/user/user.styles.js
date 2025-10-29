import {StyleSheet} from 'react-native';

import * as themes from '../../shared/styles.constants';

const UserStyles = StyleSheet.create({
  avatarLabelContainer: {
    justifyContent: 'space-around',
    padding: 10,
  },
  avatarLabelEmail: {
    fontSize: themes.SMALL_TEXT_SIZE,
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
  deleteProfileText: {
    fontWeight: '600',
    lineHeight: 25,
    paddingBottom: 20,
    paddingTop: 10,
    textAlign: 'center',
  },
  initialProjectLoadProfileContainer: {
    alignItems: 'center',
    paddingTop: 15,
  },
  initialProjectLoadProfileHeaderContainer: {
    alignItems: 'center',
    margin: 10,
  },
  initialProjectLoadProfileHeaderText: {
    fontSize: themes.LARGE_TEXT_SIZE,
    margin: 10,
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
