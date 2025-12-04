import React from 'react';
import {FlatList} from 'react-native';

import {Icon} from '@rn-vui/base';

import {NotebookPageAvatar} from '../../shared/ui/avatars';
import {PAGE_KEYS} from '../page/page.constants';
import usePage from '../page/usePage';

const SpotDataIcons = ({isReadOnly, spot}) => {

  const {getPopulatedPagesKeys} = usePage();

  const getSpotDataIcons = () => {
    const populatedPagesKeys = spot ? getPopulatedPagesKeys(spot) : [PAGE_KEYS.SAMPLES];
    return isReadOnly ? ['isReadOnly', ...populatedPagesKeys] : populatedPagesKeys;
  };

  const renderSpotDataIcon = ({item}) => {
    if (item === 'isReadOnly') {
      return (
        <Icon
          containerStyle={{justifyContent: 'center'}}
          name={'lock-closed'}
          size={12}
          type={'ionicon'}
        />
      );
    }
    else return <NotebookPageAvatar pageKey={item}/>;
  };

  return (
    <FlatList
      data={getSpotDataIcons()}
      horizontal={false}
      keyExtractor={(item, index) => index.toString()}
      listKey={new Date().toISOString()}
      numColumns={5}
      renderItem={renderSpotDataIcon}
    />
  );
};

export default SpotDataIcons;
