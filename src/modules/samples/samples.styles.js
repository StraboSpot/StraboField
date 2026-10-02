import {StyleSheet} from 'react-native';

import {
  DARKGREY,
  LIGHTGREY,
  MEDIUMGREY,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_ACCENT_COLOR_FADED_20,
  PRIMARY_ACCENT_COLOR_FADED_40,
  PRIMARY_TEXT_COLOR,
  SECONDARY_BACKGROUND_COLOR,
  SMALL_TEXT_SIZE,
  TEXT_WEIGHT_500,
  TEXT_WEIGHT_700,
} from '../../shared/styles.constants';

const sampleStyles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: SECONDARY_BACKGROUND_COLOR,
    borderColor: PRIMARY_ACCENT_COLOR,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  actionButtonPressed: {
    backgroundColor: PRIMARY_ACCENT_COLOR_FADED_20,
  },
  actionButtonText: {
    color: PRIMARY_ACCENT_COLOR,
    fontSize: SMALL_TEXT_SIZE,
    fontWeight: TEXT_WEIGHT_500,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
  },
  infoCallout: {
    alignItems: 'flex-start',
    backgroundColor: PRIMARY_ACCENT_COLOR_FADED_20,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    margin: 10,
    padding: 12,
  },
  infoCalloutEmphasis: {
    fontWeight: TEXT_WEIGHT_700,
  },
  infoCalloutText: {
    color: PRIMARY_TEXT_COLOR,
    flex: 1,
    fontSize: SMALL_TEXT_SIZE,
    lineHeight: 20,
  },
  linkSampleDate: {
    color: DARKGREY,
    fontSize: SMALL_TEXT_SIZE,
  },
  linkSampleHeader: {
    backgroundColor: LIGHTGREY,
    borderBottomColor: MEDIUMGREY,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  linkSampleHeaderText: {
    color: DARKGREY,
    fontSize: SMALL_TEXT_SIZE,
    fontWeight: TEXT_WEIGHT_700,
  },
  linkSampleName: {
    flex: 1,
  },
  linkSampleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  linkedCard: {
    alignItems: 'center',
    backgroundColor: SECONDARY_BACKGROUND_COLOR,
    borderColor: PRIMARY_ACCENT_COLOR,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  linkedCardContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  linkedCardPill: {
    backgroundColor: PRIMARY_ACCENT_COLOR_FADED_20,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  linkedCardPillPressed: {
    backgroundColor: PRIMARY_ACCENT_COLOR_FADED_40,
  },
  linkedCardPillText: {
    color: PRIMARY_ACCENT_COLOR,
    fontSize: SMALL_TEXT_SIZE,
    fontWeight: TEXT_WEIGHT_500,
  },
  linkedCardPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  linkedCardStatus: {
    color: DARKGREY,
    fontSize: SMALL_TEXT_SIZE,
    fontStyle: 'italic',
  },
  linkedCardStatusContainer: {
    alignItems: 'center',
  },
  linkedCardStatusUploaded: {
    color: PRIMARY_ACCENT_COLOR,
    fontStyle: 'normal',
  },
  linkedCardTitle: {
    color: PRIMARY_TEXT_COLOR,
    fontSize: SMALL_TEXT_SIZE,
    fontWeight: TEXT_WEIGHT_500,
  },
  listContentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default sampleStyles;
