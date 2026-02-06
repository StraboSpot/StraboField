import {StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';
import {GOLD, MEDIUM_TEXT_SIZE} from '../../../shared/styles.constants';

const notebookHeaderStyles = StyleSheet.create({
  headerImage: {
    height: 50,
    width: 50,
  },
  headerSpotName: {
    fontSize: themes.SPOT_NAME_SIZE,
    fontWeight: 'bold',
    paddingBottom: 0,
    paddingLeft: 0,
    paddingTop: 0,
  },
  headerSpotNameAndCoordsContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingLeft: 5,
  },
  sampleBanner: {
    alignItems: 'center',
    backgroundColor: GOLD,
    paddingVertical: 2.5,
  },
  sampleBannerText: {
    fontSize: MEDIUM_TEXT_SIZE, fontWeight: 'bold',
  },
  sampleSideBorders: {
    borderColor: GOLD,
    borderLeftWidth: 5,
    borderRightWidth: 5,
  },
  threeDotMenu: {
    alignItems: 'center',
    height: 50,
    width: 40,
  },
});

export default notebookHeaderStyles;

