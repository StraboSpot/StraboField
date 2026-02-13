import React, {useState} from 'react';
import {FlatList, Linking, Text, View} from 'react-native';

import {MINERAL_GLOSSARY_INFO} from './petrology.constants';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import ClearButton from '../../shared/ui/buttons/ClearButton';

const MineralsGlossary = ({addMineral}) => {
  const [activeMineralInfo, setActiveMineralInfo] = useState({});

  const glossaryChunked = chunk(MINERAL_GLOSSARY_INFO, Math.ceil((MINERAL_GLOSSARY_INFO.length + 1) / 2));

  function chunk(input, size) {
    return input.reduce((arr, item, idx) => {
      return idx % size === 0 ? [...arr, [item]] : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }, []);
  }

  const renderMineralInfo = () => {
    return (
      <View>
        <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between'}}>
          <ClearButton
            onPress={() => setActiveMineralInfo({})}
            title={'Cancel'}
          />
          <ClearButton
            onPress={() => addMineral(activeMineralInfo)}
            title={'+ Add Mineral'}
          />
        </View>
        {Object.entries(activeMineralInfo).map(([field, value]) => {
          if (field === 'mindat.org link') {
            return (
              <View style={{padding: 10}}>
                <ClearButton
                  icon={{name: 'globe-outline', type: 'ionicon', color: themes.PRIMARY_ACCENT_COLOR}}
                  key={activeMineralInfo.Name + 'MindatLink'}
                  onPress={() => Linking.openURL(value)}
                  title={'Find more information on ' + activeMineralInfo.Label + ' at Mindat.org'}
                />
              </View>
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
              <ClearButton
                key={mineralInfo.Name}
                onPress={() => setActiveMineralInfo(mineralInfo)}
                title={mineralInfo.Label}
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
