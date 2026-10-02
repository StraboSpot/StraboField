import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import useDrawActionButtons from './useDrawActionButtons';
import useDrawGeometryToggle from './useDrawGeometryToggle';
import {isEmpty} from '../../../shared/helpers';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import {MAP_MODES} from '../../maps/maps.constants';
import homeStyles from '../home.styles';

const DrawActionButtons = ({clickHandler, mapMode, openMainMenuPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  const {
    getImageSource,
    handleEditShapePressed,
    handleIntervalDragPressed,
    handleLinePressed,
    handlePointPressed,
    handlePolygonPressed,
    stratSection,
  } = useDrawActionButtons({clickHandler, mapMode});
  const {handleLineLongPressed, handlePointLongPressed, handlePolygonLongPressed} = useDrawGeometryToggle();

  /* Derived Variables */

  // Drawing files its new Spot into the target dataset and saveEdits discards the edit without one, so
  // neither tool is offered until a target is set
  const hasTargetDataset = !isEmpty(targetDatasetId);

  /* Event Handlers */

  const onChooseTargetDatasetPressed = () => {
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS}));
    openMainMenuPanel();
  };

  /* View */

  // Whether this row appears at all is useHome's hasDrawTools, since the layout around it has to know too.
  // What is left here is which of the tools to show, which is the row's own business.
  return (
    <View style={[homeStyles.drawToolsContainer, SMALL_SCREEN && homeStyles.smallScreenDrawActionButtons]}>
      {/* Having no target is allowed, so this says why the tools are missing rather than forcing a choice */}
      {hasTargetDataset ? (
        <>
          <IconButton
            onLongPress={handlePointLongPressed}
            onPress={handlePointPressed}
            source={getImageSource(MAP_MODES.DRAW.POINT)}
            style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
          />
          <IconButton
            onLongPress={handleLineLongPressed}
            onPress={handleLinePressed}
            source={getImageSource(MAP_MODES.DRAW.LINE)}
            style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
          />
          <IconButton
            onLongPress={handlePolygonLongPressed}
            onPress={handlePolygonPressed}
            source={getImageSource(MAP_MODES.DRAW.POLYGON)}
            style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
          />
          <IconButton
            onPress={handleEditShapePressed}
            source={getImageSource(MAP_MODES.EDIT)}
            style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
          />
        </>
      ) : (
        <Pressable
          accessibilityRole={'button'}
          onPress={onChooseTargetDatasetPressed}
          style={homeStyles.noTargetDatasetPrompt}
        >
          <Text style={homeStyles.noTargetDatasetPromptText}>No Target Dataset</Text>
          <Text style={homeStyles.noTargetDatasetPromptAction}>Choose One</Text>
        </Pressable>
      )}
      {stratSection && (
        <IconButton
          onPress={handleIntervalDragPressed}
          source={getImageSource(MAP_MODES.INTERVAL_DRAG)}
          style={SMALL_SCREEN && homeStyles.iconSpacingSmallScreen}
        />
      )}
    </View>
  );
};

export default DrawActionButtons;
