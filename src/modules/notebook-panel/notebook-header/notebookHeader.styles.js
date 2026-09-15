import {StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';
import {MEDIUM_TEXT_SIZE, SAMPLES_BORDER_WIDTH, SAMPLES_COLOR} from '../../../shared/styles.constants';

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
    backgroundColor: SAMPLES_COLOR,
    paddingVertical: 2.5,
  },
  sampleBannerText: {
    fontSize: MEDIUM_TEXT_SIZE, fontWeight: 'bold',
  },
  sampleSideBorders: {
    borderColor: SAMPLES_COLOR,
    borderLeftWidth: SAMPLES_BORDER_WIDTH,
    borderRightWidth: SAMPLES_BORDER_WIDTH,
  },
  threeDotMenu: {
    alignItems: 'center',
    height: 50,
    width: 40,
  },
});

export default notebookHeaderStyles;

