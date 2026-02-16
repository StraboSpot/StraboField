import * as themes from '../../../shared/styles.constants';

const IGSNModalStyles = {
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  errorMessageText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    fontWeight: 'bold',
    margin: 10,
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
  contentContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: 400,
  },
  fieldRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: themes.LIST_BORDER_COLOR,
    paddingVertical: 10,
    alignItems: 'center',
  },
  labelColumn: {
    flex: 1.5, // Controls the width of the left side
  },
  valueColumn: {
    flex: 2,   // Controls the width of the right side
    paddingLeft: 10,
  },
  fieldValueText: {
    fontSize: themes.MEDIUM_TEXT_SIZE,
    color: themes.PRIMARY_TEXT_COLOR,
    fontWeight: '400',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: themes.RED,
    borderRadius: 10,
  },
};

export default IGSNModalStyles;
