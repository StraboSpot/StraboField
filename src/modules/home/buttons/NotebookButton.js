import React, {useEffect} from 'react';
import {Animated, View} from 'react-native';

import {useSelector} from 'react-redux';

import IconButton from '../../../shared/ui/buttons/IconButton';
import homeStyles from '../home.styles';
import useNotebookUpdateIndicator from '../useNotebookUpdateIndicator';

const NotebookButton = ({closeNotebookPanel, mapMode, openNotebookPanel}) => {
  /* Data Hooks */

  const isNotebookPanelVisible = useSelector(state => state.notebook.isNotebookPanelVisible);

  const {clearUnseenSpot, hasUnseenSpot, notebookUpdateHighlightColor} = useNotebookUpdateIndicator(mapMode);

  /* Side Effects */

  // Opening the panel shows the selected Spot, and any selected while it was open were seen there
  useEffect(() => {
    clearUnseenSpot();
  }, [isNotebookPanelVisible]);

  /* Logic Helpers */

  const toggleNotebookPanel = () => {
    if (isNotebookPanelVisible) closeNotebookPanel();
    else openNotebookPanel();
  };

  /* View */

  return (
    <View>
      {!isNotebookPanelVisible && (
        <Animated.View
          style={[homeStyles.notebookButtonHighlight, {backgroundColor: notebookUpdateHighlightColor}]}
        />
      )}
      <IconButton
        onPress={toggleNotebookPanel}
        source={isNotebookPanelVisible ? require('../../../assets/icons/NotebookViewButton_pressed.png')
          : require('../../../assets/icons/NotebookViewButton.png')}
      />
      {hasUnseenSpot && !isNotebookPanelVisible && <View style={homeStyles.notebookButtonBadge}/>}
    </View>
  );
};

export default NotebookButton;
