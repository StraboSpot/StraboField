import React, {useEffect, useState} from 'react';
import {Animated, Linking, Platform, Pressable, Text, View} from 'react-native';

import useVersionCheck from './useVersionCheck';
import versionCheckStyles from './versionCheck.styles';
import alert from '../../shared/ui/alert';

const VersionCheckLabel = () => {
  const [versionObj, setVersionObj] = useState({});
  const [animatedPulse] = useState(new Animated.Value(0));
  const [showUpdateLabel, setShowUpdateLabel] = useState(false);

  const {animateLabel, checkAppStoreVersion} = useVersionCheck();

  useEffect(() => {
    let updateTimer;
    checkAppStoreVersion().then((res) => {
      if (res.needsUpdate) {
        animateLabel(animatedPulse);
        setShowUpdateLabel(true);
        updateTimer = setTimeout(() => setShowUpdateLabel(false), 6000);
      }
      setVersionObj(res);
    });
    return () => {
      clearTimeout(updateTimer);
    };
  }, []);

  const handlePress = async () => {
    alert('IMPORTANT',
      'Please make sure your data is uploaded to your online account before upgrading. '
      + ' It is best to delete and the reinstall the app',
      [
        {
          text: 'Go To Store', onPress: async () => {
            console.log('OK Pressed');
            const res = await Linking.canOpenURL(versionObj.url);
            if (res) await Linking.openURL(versionObj.url);
          },
        },
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
      ]);
  };

  if (showUpdateLabel) {
    return (
      <View style={versionCheckStyles.versionPositionHome}>
        <Pressable
          onPress={handlePress}
          style={versionCheckStyles.container}>
          {versionObj.needsUpdate && (
            <Animated.View
              style={{
                ...versionCheckStyles.twelvePointBurstContainer,
                transform: [{scale: animatedPulse}],
              }}>
              <View style={versionCheckStyles.twelvePointBurstMain}>
                <View style={versionCheckStyles.textContainer}>
                  <Text style={versionCheckStyles.title}>Update Available!</Text>
                  <View>
                    <Text style={versionCheckStyles.versionText}>{versionObj.version}</Text>
                    <Text style={versionCheckStyles.text}>
                      is available in the{' '}
                      {Platform.OS === 'ios' ? 'AppStore' : 'PlayStore'}
                    </Text>
                    <Text style={{...versionCheckStyles.text, fontSize: 10}}>
                      Press to go to{' '}
                      {Platform.OS === 'ios' ? 'AppStore' : 'PlayStore'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={versionCheckStyles.twelvePointBurst30}/>
              <View style={versionCheckStyles.twelvePointBurst60}/>
            </Animated.View>
          )}
        </Pressable>
      </View>
    );
  }
};

export default VersionCheckLabel;
