import React from 'react';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {truncateText} from '../../shared/helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';

const SpotNotesOverview = ({page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const savedNote = useSelector(state => state.spot.selectedSpot.properties.notes);

  /* View */

  return (
    <>
      {savedNote ? (
          <ListItem
            containerStyle={commonStyles.listItem}
            onPress={() => dispatch(setNotebookPageVisible(page.key))}
          >
            <ListItem.Content style={{maxHeight: 300}}>
              <ListItem.Title style={commonStyles.listItemTitle}>{truncateText(savedNote, 300)}</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        )
        : <ListEmptyText onPress={() => dispatch(setNotebookPageVisible(page.key))} text={'No Notes'}/>}
    </>
  );
};

export default SpotNotesOverview;
