import {StyleSheet} from 'react-native';

import * as themes from '../../../shared/styles.constants';
import {MEDIUMGREY} from '../../../shared/styles.constants';

const styles = StyleSheet.create({
  bboxButton: {
    padding: 15,
  },
  bboxColumnContainer: {
    backgroundColor: 'white',
    flex: 1,
  },
  bboxCoordsContainers: {
    marginHorizontal: 10,
  },
  bboxMessageText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bboxRowContainer: {
    backgroundColor: 'white',
    height: 25,
  },
  bboxTableHead: {
    backgroundColor: MEDIUMGREY,
    height: 20,
  },
  bboxText: {
    textAlign: 'center',
  },
  bottomButtonsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
    paddingHorizontal: 10,
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
    fontWeight: themes.TEXT_WEIGHT_500,
  },
  loadingMapModalTitleContainer: {
    flex: 1,
  },
  mapOverviewBboxText: {
    paddingLeft: 20,
  },
  mapOverviewText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: themes.TEXT_WEIGHT_500,
    padding: 5,
  },
  // mapOverview
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
