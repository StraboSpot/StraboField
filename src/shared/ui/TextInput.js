import React, {useId} from 'react';
import {InputAccessoryView, Keyboard, Platform, Pressable, Text, TextInput as RNTextInput, View} from 'react-native';

import {SMALL_SCREEN} from '../styles.constants';
import styles from './ui.styles';

// The iPhone keyboard has no key to hide it (iPad's does), and Return in a multiline field adds a line, so on an
// iPhone every input gets a Done bar above the keyboard. Use this in place of React Native's TextInput, and pass it
// as InputComponent to an rn-vui Input or SearchBar.
const isShowDoneBar = Platform.OS === 'ios' && SMALL_SCREEN;

const TextInput = ({ref, ...props}) => {
  // Each input needs its own bar: an InputAccessoryView attaches only to the first input carrying its nativeID
  const doneBarId = useId();

  if (!isShowDoneBar) return <RNTextInput ref={ref} {...props}/>;

  return (
    <>
      <RNTextInput inputAccessoryViewID={doneBarId} ref={ref} {...props}/>
      <InputAccessoryView nativeID={doneBarId}>
        <View style={styles.keyboardDoneBar}>
          <Pressable hitSlop={10} onPress={Keyboard.dismiss}>
            <Text style={styles.keyboardDoneText}>Dismiss</Text>
          </Pressable>
        </View>
      </InputAccessoryView>
    </>
  );
};

export default TextInput;
