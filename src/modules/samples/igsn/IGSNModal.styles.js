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
    width: 400,
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
    margin: 15,
    padding: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  uploadStepText: {
    color: themes.PRIMARY_TEXT_COLOR,
    fontSize: themes.SMALL_TEXT_SIZE,
    marginTop: 6,
    textAlign: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: themes.LIST_BORDER_COLOR,
    paddingVertical: 10,
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
  sesarAuthText: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 50,
    textAlign: 'left',
  },
  sesarImage: {
    borderWidth: 2,
    height: 100,
    width: 300,
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
