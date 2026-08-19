import {StyleSheet} from 'react-native';

import {LARGE_TEXT_SIZE, MEDIUM_TEXT_SIZE, MEDIUMGREY, PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';

const styles = StyleSheet.create({
  bold: {
    fontWeight: '600',
  },
  buildText: {
    fontSize: MEDIUM_TEXT_SIZE,
    paddingBottom: 10,
  },
  commitLink: {
    marginLeft: 8,
    paddingTop: 3,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  heading: {
    fontSize: LARGE_TEXT_SIZE,
    marginBottom: 8,
    marginTop: 10,
  },
  infoIcon: {
    marginLeft: 8,
  },
  paragraph: {
    fontSize: MEDIUM_TEXT_SIZE,
    lineHeight: 22,
    marginBottom: 24,
  },
  releaseNoteBullet: {
    fontSize: MEDIUM_TEXT_SIZE,
    lineHeight: 22,
    marginRight: 8,
  },
  releaseNoteEmpty: {
    color: MEDIUMGREY,
    fontSize: MEDIUM_TEXT_SIZE,
    fontStyle: 'italic',
    marginBottom: 8,
    paddingLeft: 10,
  },
  releaseNoteLabel: {
    fontWeight: '600',
  },
  releaseNoteRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 10,
  },
  releaseNoteText: {
    flex: 1,
    fontSize: MEDIUM_TEXT_SIZE,
    lineHeight: 22,
  },
  releaseNotesContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  releaseNotesOverlay: {
    maxWidth: 600,
    width: '90%',
  },
  releaseSeriesHeading: {
    fontSize: LARGE_TEXT_SIZE,
    fontWeight: '700',
    marginBottom: 10,
  },
  releaseUnreleasedTag: {
    color: PRIMARY_ACCENT_COLOR,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  releaseVersionHeading: {
    fontSize: MEDIUM_TEXT_SIZE,
    fontWeight: '700',
    marginBottom: 6,
  },
  releaseVersionSection: {
    marginBottom: 16,
  },
  versionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 5,
  },
  versionText: {
    fontSize: LARGE_TEXT_SIZE,
  },
});

export default styles;
