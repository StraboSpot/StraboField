import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  inputContainer: {
    paddingTop: 10,
  },
  labelContainer: {
    flexShrink: 1,
    margin: 10,
  },
  rowContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelPositioned: {
    position: 'absolute',
  },
  sliderLabelsContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    paddingBottom: 10,
    paddingHorizontal: '5%',
    paddingTop: 10,
    position: 'relative',
    width: '90%',
  },
});

export default styles;
