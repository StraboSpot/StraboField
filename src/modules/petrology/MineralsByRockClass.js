import React from 'react';
import {FlatList, View} from 'react-native';

import {Button} from '@rn-vui/base';

import {MINERALS_BY_CLASS} from './petrology.constants';
import SectionDivider from '../../shared/ui/SectionDivider';

const MineralsByRockClass = ({addMineral}) => {
  return (
    <FlatList ListHeaderComponent={
      <View style={{flex: 1, flexDirection: 'column'}}>
        <View style={{flex: 1, flexDirection: 'row'}}>
          <View style={{flex: 1, alignItems: 'flex-start'}}>
            <SectionDivider dividerText={'Plutonic'}/>
            {MINERALS_BY_CLASS.plutonic.map(mineral => (
              <Button
                key={mineral.Name}
                onPress={() => addMineral(mineral)}
                title={'+ ' + mineral.Label}
                titleProps={{numberOfLines: 1}}
                type={'clear'}
              />
            ))}
          </View>
          <View style={{flex: 1, alignItems: 'flex-start'}}>
            <SectionDivider dividerText={'Metamorphic'}/>
            {MINERALS_BY_CLASS.metamorphic.map(mineral => (
              <Button
                key={mineral.Name}
                onPress={() => addMineral(mineral)}
                title={'+ ' + mineral.Label}
                titleProps={{numberOfLines: 1}}
                type={'clear'}
              />
            ))}
          </View>
        </View>
        <View style={{flex: 1, flexDirection: 'row'}}>
          <View style={{flex: 1, alignItems: 'flex-start'}}>
            <SectionDivider dividerText={'Volcanic'}/>
            {MINERALS_BY_CLASS.volcanic.map(mineral => (
              <Button
                key={mineral.Name}
                onPress={() => addMineral(mineral)}
                title={'+ ' + mineral.Label}
                titleProps={{numberOfLines: 1}}
                type={'clear'}
              />
            ))}
          </View>
          <View style={{flex: 1, alignItems: 'flex-start'}}>
            <SectionDivider dividerText={'Alteration, Ore'}/>
            {MINERALS_BY_CLASS.alteration_ore.map(mineral => (
              <Button
                key={mineral.Name}
                onPress={() => addMineral(mineral)}
                title={'+ ' + mineral.Label}
                titleProps={{numberOfLines: 1}}
                type={'clear'}
              />
            ))}
          </View>
        </View>
      </View>
    }/>
  );
};

export default MineralsByRockClass;
