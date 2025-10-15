import React, {useState} from 'react';
import {FlatList, Linking, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';

import {MINERAL_GLOSSARY_INFO} from './petrology.constants';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';

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
            onPress={() => setActiveMineralInfo({})}
            title={'Cancel'}
            titleStyle={commonStyles.standardButtonText}
            type={'clear'}
          />
          <Button
            onPress={() => addMineral(activeMineralInfo)}
            title={'Add Mineral'}
            titleStyle={commonStyles.standardButtonText}
            type={'clear'}
          />
        </View>
        {Object.entries(activeMineralInfo).map(([field, value]) => {
          if (field === 'mindat.org link') {
            return (
              <Button
                containerStyle={{padding: 10}}
                icon={{name: 'globe-outline', type: 'ionicon', color: themes.PRIMARY_ACCENT_COLOR}}
                key={activeMineralInfo.Name + 'MindatLink'}
                onPress={() => Linking.openURL(value)}
                title={'Click here for more mineral information on ' + activeMineralInfo.Label + ' from Mindat.org'}
                type={'clear'}
              />
            );
          }
          else if (field !== 'Name') {
            return (
              <Text key={activeMineralInfo.Name + field} style={{paddingHorizontal: 10}}>
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
      <View style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
        {glossaryChunked.map(glossaryChunk => (
          <View key={JSON.stringify(glossaryChunk)} style={{flex: 1}}>
            {glossaryChunk.map(mineralInfo => (
              <Button
                key={mineralInfo.Name}
                onPress={() => setActiveMineralInfo(mineralInfo)}
                title={mineralInfo.Label}
                type={'clear'}
              />
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <FlatList ListHeaderComponent={
      isEmpty(activeMineralInfo) ? renderMineralList() : renderMineralInfo()
    }/>
  );
};

export default MineralsGlossary;
