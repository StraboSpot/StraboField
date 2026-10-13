import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {
  DARKGREY,
  MEDIUM_TEXT_SIZE,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_BACKGROUND_COLOR,
  PRIMARY_TEXT_COLOR,
  SECONDARY_TEXT_COLOR,
  SMALL_TEXT_SIZE,
} from '../styles.constants';

// Shown by the root error boundary in place of the app after an error nothing else caught. Plain React Native only:
// the store, navigation or toasts may be what broke, so this must not depend on any of them. Try Again remounts the
// app; everything the user saved is in the store and on the device, so nothing is lost.
const AppErrorFallback = ({eventId, resetError}) => (
  <View style={styles.container}>
    <Text style={styles.title}>Something went wrong</Text>
    <Text style={styles.message}>
      The app ran into an error, and it has been reported to the developers. Your saved data is safe.
    </Text>
    <Pressable
      accessibilityRole={'button'}
      onPress={resetError}
      style={({pressed}) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Text style={styles.buttonText}>Try Again</Text>
    </Pressable>
    <Text style={styles.message}>If this keeps happening, close and reopen the app.</Text>
    {!!eventId && <Text selectable style={styles.reference}>Reference: {eventId}</Text>}
  </View>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: PRIMARY_ACCENT_COLOR,
    borderRadius: 8,
    marginVertical: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: SECONDARY_TEXT_COLOR,
    fontSize: MEDIUM_TEXT_SIZE,
    fontWeight: '600',
  },
  container: {
    alignItems: 'center',
    backgroundColor: PRIMARY_BACKGROUND_COLOR,
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  message: {
    color: PRIMARY_TEXT_COLOR,
    fontSize: SMALL_TEXT_SIZE,
    maxWidth: 420,
    textAlign: 'center',
  },
  reference: {
    color: DARKGREY,
    fontSize: SMALL_TEXT_SIZE,
    marginTop: 24,
  },
  title: {
    color: PRIMARY_TEXT_COLOR,
    fontSize: MEDIUM_TEXT_SIZE,
    fontWeight: '600',
    marginBottom: 12,
  },
});

export default AppErrorFallback;
