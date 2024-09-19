import {StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';

const styles = StyleSheet.create({
  bboxButton: {
    padding: 30,
  },
  bboxCoordsContainers: {
    alignItems: 'center', padding: 5
  },
  itemContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  itemSubContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 7,
    paddingLeft: 10,
    paddingTop: 3,
    width: '90%',
  },
  itemSubTextStyle: {
    fontSize: 14,
    marginLeft: 10,
  },
  itemTextStyle: {
    fontSize: themes.PRIMARY_TEXT_SIZE,
    marginLeft: 10,
  },
  loadingMapButtonContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingMapContentContainer: {
    flex: 2,
    justifyContent: 'center',
  },
  loadingMapModalContainer: {
    height: 250,
  },
  loadingMapModalContentText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: themes.TEXT_WEIGHT,
  },
  loadingMapModalTitleContainer: {
    flex: 1,
  },
  mapOverviewBboxText: {
    paddingLeft: 20,
  },
  mapOverviewText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    padding: 5,
  },
  mapTypeInfoContainer: {
    alignItems: 'center',
    padding: 10,
  },
  mapTypeInfoText: {
    lineHeight: 20,
    textAlign: 'center',
  },
  requiredMessage: {
    color: themes.RED,
    fontSize: themes.SMALL_TEXT_SIZE,
    margin: 5,
  },
});

export default styles;
