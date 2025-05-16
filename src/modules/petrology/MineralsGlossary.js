import React, {useState} from 'react';
import {FlatList, Linking, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';

import {MINERAL_GLOSSARY_INFO} from './petrology.constants';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import styles from '../page/ui/ui.styles';

const MineralsGlossary = ({addMineral}) => {
  const [activeMineralInfo, setActiveMineralInfo] = useState({});

  const chunk = (input, size) => {
    return input.reduce((arr, item, idx) => {
      return idx % size === 0 ? [...arr, [item]] : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }, []);
  };

  const glossaryChunked = chunk(MINERAL_GLOSSARY_INFO, Math.ceil((MINERAL_GLOSSARY_INFO.length + 1) / 2));

  const renderMineralInfo = () => {
    return (
      <View>
        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between'}}>
          <Button
            titleStyle={styles.buttonText}
            title={'Cancel'}
            type={'clear'}
            onPress={() => setActiveMineralInfo({})}
          />
          <Button
            titleStyle={styles.buttonText}
            title={'Add Mineral'}
            type={'clear'}
            onPress={() => addMineral(activeMineralInfo)}
          />
        </View>
        {Object.entries(activeMineralInfo).map(([field, value]) => {
          if (field === 'mindat.org link') {
            return (
              <Button
                key={activeMineralInfo.Name + 'MindatLink'}
                title={'Click here for more mineral information on ' + activeMineralInfo.Label + ' from Mindat.org'}
                type={'clear'}
                icon={{name: 'globe-outline', type: 'ionicon', color: themes.PRIMARY_ACCENT_COLOR}}
                containerStyle={{padding: 10}}
                onPress={() => Linking.openURL(value)}
              />
            );
          }
          else if (field !== 'Name') {
            return (
              <Text key={activeMineralInfo.Name + field}>
                <Text style={{fontWeight: 'bold'}}>{field}:</Text>
                {value}
              </Text>
            );
          }
        })}
      </View>
    );
  };

  const renderMineralList = () => {
    return (
      <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-evenly'}}>
        {glossaryChunked.map(glossaryChunk => (
          <View style={{flex: 1}} key={JSON.stringify(glossaryChunk)}>
            {glossaryChunk.map(mineralInfo => (
              <Button
                key={mineralInfo.Name}
                title={mineralInfo.Label}
                type={'clear'}
                onPress={() => setActiveMineralInfo(mineralInfo)}
              />
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={{paddingLeft: 10, paddingRight: 10}}>
      <FlatList ListHeaderComponent={
        isEmpty(activeMineralInfo) ? renderMineralList() : renderMineralInfo()
      }/>
    </View>
  );
};

export default MineralsGlossary;
