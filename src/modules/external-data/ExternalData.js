import React, {useRef, useState} from 'react';
import {Platform, Text, TextInput, View} from 'react-native';

import {ButtonGroup, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import DataWrapper from './DataWrapper';
import useExternalData from './useExternalData';
import commonStyles from '../../shared/common.styles';
import * as themes from '../../shared/styles.constants';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import SectionDivider from '../../shared/ui/SectionDivider';
import {formStyles} from '../form';
import PageHeader from '../page/PageHeader';

const ExternalData = ({isReadOnly}) => {
  /* Data Hooks / State */

  const spot = useSelector(state => state.spot.selectedSpot);

  const {readCSV, saveURL} = useExternalData();

  const inputRef = useRef(null);

  const [error, setError] = useState(false);
  const [protocol, setProtocol] = useState('http://');
  const [url, setUrl] = useState('');

  /* Event Handlers */

  const handleFileChange = async (e) => {
    console.log('CSV File', e.target.files[0]);
    const file = e.target.files[0];
    await readCSV(file);
    console.log('CSV From Web Saved');
  };

  /* Logic Helpers */

  const importCSVFile = () => {
    try {
      if (Platform.OS !== 'web') readCSV().catch(console.error);
      else {
        console.log('WEB');
        inputRef.current.click();
      }
    }
    catch (err) {
      console.error('ERROR selecting .CSV file', err);
    }
  };

  const saveUrl = async () => {
    try {
      saveURL(protocol, url);
      setUrl('');
      setError(false);
    }
    catch (err) {
      setError(true);
      setTimeout(() => setError(false), 3000);
      console.error('Not Valid URL Yet');
    }
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <PageHeader pageTitle={'External Data'}/>
      <SectionDivider dividerText={'Links To Web Resources'}/>
      <View style={{flex: 1}}>
        {!isReadOnly && (
          <>
            <ButtonGroup
              buttons={['http://', 'https://']}
              containerStyle={{borderRadius: 10}}
              onPress={i => i === 0 ? setProtocol('http://') : setProtocol('https://')}
              selectedButtonStyle={{backgroundColor: themes.PRIMARY_ACCENT_COLOR}}
              selectedIndex={protocol === 'http://' ? 0 : 1}
              textStyle={{color: themes.PRIMARY_ACCENT_COLOR}}
            />
            <ListItem containerStyle={commonStyles.listItem}>
              <ListItem.Content style={{flexDirection: 'row', justifyContent: 'flex-start'}}>
                <View>
                  <TextInput
                    editable={false}
                    multiline={true}
                    style={formStyles.fieldValue}
                    value={protocol || ''}
                  />
                </View>
                <View style={{flex: 1}}>
                  <TextInput
                    autoCapitalize={'none'}
                    keyboardType={'url'}
                    multiline={true}
                    onChangeText={text => setUrl(text)}
                    onFocus={() => setError(false)}
                    placeholder={'Example -> www.usgs.gov'}
                    placeholderTextColor={themes.MEDIUMGREY}
                    style={formStyles.fieldValue}
                    textContentType={'URL'}
                    value={url || ''}
                  />
                </View>
              </ListItem.Content>
            </ListItem>
            {error && <Text style={formStyles.fieldError}>Not a valid url</Text>}
            <OutlineButton
              disabled={url === ''}
              onPress={saveUrl}
              title={'🌐 Add Link'}
            />
          </>
        )}
        <View style={{flex: 1}}>
          <DataWrapper editable={!isReadOnly} spot={spot} urlData={true}/>
        </View>
      </View>
      <View style={{flex: 1}}>
        <View style={{paddingTop: 15}}>
          <SectionDivider dividerText={'Tables'}/>
          {Platform.OS === 'web' && (
            <input
              accept={'.csv'}
              id={'selectedCSV'}
              name={'.csv'}
              onChange={handleFileChange}
              onClick={() => console.log('Canceled')}
              ref={inputRef}
              style={{display: 'none'}}
              type={'file'}
            />
          )}
          {!isReadOnly && (
            <OutlineButton
              onPress={importCSVFile}
              title={'📎  Attach table from a .CSV file'}
            />
          )}
        </View>
        <View style={{flex: 1}}>
          <DataWrapper editable={!isReadOnly} spot={spot} urlData={false}/>
        </View>
      </View>
    </View>
  );
};

export default ExternalData;
