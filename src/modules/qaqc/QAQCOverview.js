import React from 'react';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty, truncateText} from '../../shared/helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';

const QAQCOverview = ({page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const savedQAQC = useSelector(state => state.spot.selectedSpot.properties.qaqc?.notes);

  /* View */

  return (
    <>
      {isEmpty(savedQAQC) ? <ListEmptyText onPress={() => dispatch(setNotebookPageVisible(page.key))} text={'No QAQC'}/>
        : (
          <ListItem
            containerStyle={commonStyles.listItem}
            onPress={() => dispatch(setNotebookPageVisible(page.key))}
          >
            <ListItem.Content style={{maxHeight: 300}}>
              <ListItem.Title style={commonStyles.listItemTitle}>{truncateText(savedQAQC, 300)}</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        )
      }
    </>
  );
};

export default QAQCOverview;
