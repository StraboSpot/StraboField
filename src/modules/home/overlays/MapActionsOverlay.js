import React from 'react';
import {FlatList, Platform} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {overlayStyles} from './index';
import commonStyles from '../../../shared/common.styles';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import {MAP_ACTIONS} from '../home.constants';

const MapActionsOverlay = ({
                             onPress,
                             onTouchOutside,
                             visible,
                           }) => {
  /* Data Hooks */

  const currentBasemap = useSelector(state => state.map.currentBasemap);
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const {isInternetReachable, isConnected} = useSelector(state => state.connections.isOnline);
  const isTestingMode = useSelector(state => state.project.isTestingMode);
  const stratSection = useSelector(state => state.map.stratSection);

  /* Logic Helpers */

  const mapActionItem = (item) => {
    const isNative = Platform.OS !== 'web';
    const isIOS = Platform.OS === 'ios';
    const hasValidConnection = isConnected && (isInternetReachable || currentBasemap?.source);
    const isSaveMapVisible = item.key === 'saveMap' && isNative && hasValidConnection;
    const isStereonetVisible = item.key === 'stereonet' && isIOS;
    const isStratSectionVisible = item.key === 'stratSection' && stratSection;
    const isSelectSpotsVisible = item.key === 'selectSpots' && isTestingMode;
    const isMapMeasurementVisible = item.key === 'mapMeasurement' && !stratSection && !currentImageBasemap;

    const otherKeysToHide = new Set(['saveMap', 'stereonet', 'stratSection', 'selectSpots', 'mapMeasurement']);
    const isDefaultVisible = !otherKeysToHide.has(item.key);

    const shouldRender = (
      isSaveMapVisible
      || isStereonetVisible
      || isStratSectionVisible
      || isSelectSpotsVisible
      || isMapMeasurementVisible
      || isDefaultVisible
    );

    if (!shouldRender) return null;

    return (
      <ListItem
        containerStyle={[
          commonStyles.listItem,
          SMALL_SCREEN && {
            minHeight: 50,
            paddingVertical: 15,
            paddingHorizontal: 20,
          },
        ]}
        key={item.key}
        onPress={() => onPress(item.key)}
      >
        <ListItem.Title style={[
          commonStyles.listItemTitle,
          SMALL_SCREEN && {
            fontSize: 16,
            fontWeight: '500',
          },
        ]}>
          {item.title}
        </ListItem.Title>
      </ListItem>
    );
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={onTouchOutside}
      fullscreen={SMALL_SCREEN}
      headerTitle={'Map Actions'}
      isVisible={visible}
      onBackdropPress={onTouchOutside}
      overlayStyleOverride={{...overlayStyles.overlayMapMenuPosition, height: 'auto'}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={SMALL_SCREEN}
    >
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        contentContainerStyle={{
          alignItems: 'center',
          paddingVertical: SMALL_SCREEN ? 20 : 0,
          flexGrow: SMALL_SCREEN ? 1 : 0,
        }}
        data={MAP_ACTIONS}
        key={'mapActions'}
        renderItem={({item}) => mapActionItem(item)}
        style={{width: '100%'}}
      />
    </ModalWrapper>
  );
};

export default MapActionsOverlay;
