import React from 'react';
import {FlatList, View} from 'react-native';

import {MINERALS_BY_CLASS} from './petrology.constants';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import SectionDivider from '../../shared/ui/SectionDivider';

const MineralsByRockClass = ({addMineral}) => {
  return (
    <FlatList ListHeaderComponent={
      <View style={{flex: 1, flexDirection: 'column'}}>
        <View style={{flex: 1, flexDirection: 'row'}}>
          <View style={{flex: 1, alignItems: 'flex-start'}}>
            <SectionDivider dividerText={'Plutonic'}/>
            {MINERALS_BY_CLASS.plutonic.map(mineral => (
              <ClearButton
                key={mineral.Name}
                onPress={() => addMineral(mineral)}
                title={'+ ' + mineral.Label}
                titleProps={{numberOfLines: 1}}
              />
            ))}
          </View>
          <View style={{flex: 1, alignItems: 'flex-start'}}>
            <SectionDivider dividerText={'Metamorphic'}/>
            {MINERALS_BY_CLASS.metamorphic.map(mineral => (
              <ClearButton
                key={mineral.Name}
                onPress={() => addMineral(mineral)}
                title={'+ ' + mineral.Label}
                titleProps={{numberOfLines: 1}}
              />
            ))}
          </View>
        </View>
        <View style={{flex: 1, flexDirection: 'row'}}>
          <View style={{flex: 1, alignItems: 'flex-start'}}>
            <SectionDivider dividerText={'Volcanic'}/>
            {MINERALS_BY_CLASS.volcanic.map(mineral => (
              <ClearButton
                key={mineral.Name}
                onPress={() => addMineral(mineral)}
                title={'+ ' + mineral.Label}
                titleProps={{numberOfLines: 1}}
              />
            ))}
          </View>
          <View style={{flex: 1, alignItems: 'flex-start'}}>
            <SectionDivider dividerText={'Alteration, Ore'}/>
            {MINERALS_BY_CLASS.alteration_ore.map(mineral => (
              <ClearButton
                key={mineral.Name}
                onPress={() => addMineral(mineral)}
                title={'+ ' + mineral.Label}
                titleProps={{numberOfLines: 1}}
              />
            ))}
          </View>
        </View>
      </View>
    }/>
  );
};

export default MineralsByRockClass;
