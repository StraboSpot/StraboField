import * as themes from '../../../shared/styles.constants';

const IGSNModalStyles = {
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  errorContainer: {
    alignItems: 'center',
    borderRadius: 10,
    margin: 15,
    padding: 20,
  },
  statusHeaderText: {
    fontSize: themes.LARGE_TEXT_SIZE,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusMessageText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    borderRadius: 10,
    margin: 5,
    paddingTop: 20,
  },
  stepIconContainer: {
    alignItems: 'center',
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  stepLabel: {
    color: themes.PRIMARY_TEXT_COLOR,
    flex: 1,
    fontSize: themes.MEDIUM_TEXT_SIZE,
  },
  stepRow: {
    alignItems: 'center',
    borderBottomColor: themes.LIST_BORDER_COLOR,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  stepsContainer: {
    marginTop: 12,
    width: '100%',
  },
  fieldRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: themes.LIST_BORDER_COLOR,
    // paddingVertical: 10,
    alignItems: 'center',
  },
  fieldValueText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    color: themes.PRIMARY_TEXT_COLOR,
    fontWeight: '400',
  },
  labelColumn: {
    flex: 1.5, // Controls the width of the left side
  },
  requiredLabel: {
    color: themes.WARNING_COLOR,
    fontSize: themes.SMALL_TEXT_SIZE,
    fontStyle: 'italic',
    margin: 20,
    textAlign: 'center',
  },
  sesarAuthText: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 50,
    textAlign: 'left',
  },
  sesarImage: {
    borderWidth: 2,
    height: 100,
    width: 275,
  },
  sesarImageContainer: {
    alignContent: 'center',
    backgroundColor: 'rgb(164, 200, 209)',
    justifyContent: 'center',
  },
  uploadContentDescription: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    color: themes.PRIMARY_TEXT_COLOR,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  uploadContentText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    padding: 5,
  },
  valueColumn: {
    flex: 2,   // Controls the width of the right side
    paddingLeft: 10,
  },
};

export default IGSNModalStyles;
