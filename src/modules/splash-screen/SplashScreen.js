import React from 'react';
import {ImageBackground, Platform, ScrollView, Text, View} from 'react-native';

import DeviceInfo from 'react-native-device-info';
import {useSelector} from 'react-redux';

import splashScreenStyles from './splashScreen.styles';
import BatteryInfo from '../../services/BatteryInfo';
import ConnectionStatusIcon from '../../services/ConnectionStatusIcon';
import {VERSION_NUMBER} from '../../shared/app.constants';
import {getFontSizeByWindowWidth} from '../../shared/Helpers';
import Loading from '../../shared/ui/Loading';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import VersionCheckLabel from '../version-check/VersionCheckLabel';

const SplashScreen = ({children}) => {
  const {width, height} = useWindowSize();

  const fontSize = getFontSizeByWindowWidth({width, height}, 40);
  const titleStyles = [splashScreenStyles.title, {fontSize}];

  const loading = useSelector(state => state.home.loading.home);

  return (
    <ImageBackground
      source={require('../../assets/images/splash-screen.jpeg')}
      style={splashScreenStyles.backgroundImage}
    >
      <ScrollView automaticallyAdjustKeyboardInsets={true} style={{flex: 1}}>
        <View style={splashScreenStyles.wifiIndicatorContainer}>
          <ConnectionStatusIcon/>
          {Platform.OS === 'ios' && <BatteryInfo/>}
        </View>
        <View style={splashScreenStyles.contentContainer}>
          <View style={splashScreenStyles.titleContainer}>
            <Text style={titleStyles}>StraboField</Text>
            <Text style={splashScreenStyles.versionNumberText}>
              v{VERSION_NUMBER}
            </Text>
          </View>
          {children}
        </View>
        {/*{__DEV__ && (*/}
        {/*  <View style={splashScreenStyles.dimensionsContainer}>*/}
        {/*    <Text style={splashScreenStyles.dimensionsText}>*/}
        {/*      Screen Dimensions*/}
        {/*    </Text>*/}
        {/*    <Text style={splashScreenStyles.dimensionsText}>*/}
        {/*      {' '}*/}
        {/*      H: {height.toFixed(0)}{' '}*/}
        {/*    </Text>*/}
        {/*    <Text style={splashScreenStyles.dimensionsText}>*/}
        {/*      W: {width.toFixed(0)}{' '}*/}
        {/*    </Text>*/}
        {/*  </View>*/}
        {/*)}*/}
      </ScrollView>
      <VersionCheckLabel/>
      <Text style={splashScreenStyles.buildNumberText}>
        Build: {DeviceInfo.getBuildNumber()}
      </Text>
      <Loading isLoading={loading} size={60}/>
    </ImageBackground>
  );
};

export default SplashScreen;
