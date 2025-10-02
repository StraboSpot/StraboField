import React from 'react';
import {FlatList, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {ListItem} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import alert from '../../../shared/ui/alert';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import {setLoadingStatus} from '../../home/home.slice';
import {useSpots} from '../../spots';
import {setSelectedSpot} from '../../spots/spots.slice';
import {setStratSection} from '../maps.slice';

const StratSectionsList = ({closeManMenuPanel}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const {getSpotsWithStratSection} = useSpots();

  const spotsWithStratSection = getSpotsWithStratSection();
  console.log('Spots with Strat Section:', spotsWithStratSection);

  const handleStratSectionPressed = (spot) => {
    dispatch(setLoadingStatus({view: 'home', bool: true}));
    const stratSectionSettings = spot?.properties?.sed?.strat_section;
    if (stratSectionSettings) {
      closeManMenuPanel();
      if (SMALL_SCREEN) navigation.navigate('HomeScreen', {screen: 'Map'});
      setTimeout(() => {
        dispatch(setStratSection(stratSectionSettings));
        dispatch(setSelectedSpot(spot));
        dispatch(setLoadingStatus({view: 'home', bool: false}));
      }, 500);
    }
    else {
      alert('Strat Section not found!');
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
  };

  const renderStratSectionItem = (spot) => {
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        keyExtractor={(item, index) => item?.properties?.id?.toString() || index.toString()}
        onPress={() => handleStratSectionPressed(spot)}
      >
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>
            {spot?.properties?.sed?.strat_section?.section_well_name || 'Unnamed'}
          </ListItem.Title>
        </ListItem.Content>
      </ListItem>
    );
  };

  return (
    <View style={{flex: 1}}>
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No Strat Sections in Visible Datasets'}/>}
        data={spotsWithStratSection}
        keyExtractor={spot => spot.properties.id.toString()}
        renderItem={({item}) => renderStratSectionItem(item)}
      />
    </View>
  );
};

export default StratSectionsList;
