import React, {useEffect, useState} from 'react';
import {AppState, FlatList, Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';

import {doesBackupDirectoryExist} from './projects.slice';
import useProject from './useProject';
import {APP_DIRECTORIES} from '../../services/files/directories.constants';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import * as themes from '../../shared/styles.constants';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import Loading from '../../shared/ui/Loading';
import ConnectionRequiredMessage from '../../shared/ui/text/ConnectionRequiredMessage';
import useIsConnectionAvailable from '../connections/useConnectionStatus';

const ProjectList = ({doRefresh, onProjectPress, source}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const userData = useSelector(state => state.user);

  const isConnectionAvailable = useIsConnectionAvailable();
  const {getAllDeviceProjects, getAllServerProjects} = useProject();

  /* Local State */

  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectsArr, setProjectsArr] = useState([]);

  /* Side Effects */

  useEffect(() => {
    console.log('UE ProjectList []');
    AppState.addEventListener('change', handleStateChange);
    return () => {
      AppState.addEventListener(
        'change',
        () => console.log('APP STATE EVENT REMOVED IN PROJECT LIST')).remove();
    };
  }, []);

  useEffect(() => {
    console.log('UE ProjectList [source]', source);
    getAllProjects().then(() => console.log('OK got projects'));
  }, [doRefresh]);

  /* Event Handlers */

  const handleStateChange = async (state) => {
    if (state === 'active' && source === 'device') {
      getAllProjects().then(() => console.log('Updated Project List'));
    }
  };

  /* Logic Helpers */

  const getAllProjects = async () => {
    let projectsResponse;
    setLoading(true);
    if (source === 'server') projectsResponse = await getAllServerProjects();
    else if (source === 'device') projectsResponse = await getAllDeviceProjects(APP_DIRECTORIES.BACKUP_DIR);
    if (!projectsResponse) {
      if (source === 'device') {
        dispatch(doesBackupDirectoryExist(false));
        setIsError(true);
        setErrorMessage('Cannot find a backup directory on this device...');
      }
      else setErrorMessage('Error getting project');
      setLoading(false);
    }
    else {
      setIsError(false);
      console.log('List of Projects:', projectsResponse);
      setProjectsArr(projectsResponse);
      setLoading(false);
    }
  };

  /* Render Functions */

  const renderErrorMessage = () => {
    return (
      <View>
        <Text style={{color: 'red', textAlign: 'center'}}>{errorMessage}</Text>
      </View>
    );
  };

  const renderProjectItem = (item) => {
    const modifiedTimeAndDate = moment(item.modified_timestamp).format('MMM Do YYYY, h:mm a');
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        disabled={!isConnectionAvailable && source !== 'device'}
        disabledStyle={{backgroundColor: 'lightgrey'}}
        onPress={() => onProjectPress(item)}
      >
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>
            {source === 'server' ? item.name : item.fileName}
          </ListItem.Title>
          {modifiedTimeAndDate && modifiedTimeAndDate !== 'Invalid date' && (
            <ListItem.Subtitle style={commonStyles.listItemSubtitle}>
              Updated: {modifiedTimeAndDate}
            </ListItem.Subtitle>
          )}
        </ListItem.Content>
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  const renderProjectsList = () => {
    if (!isEmpty(userData)) {
      return (
        <View style={{flex: 1}}>
          {source === 'server' && !isConnectionAvailable && (
            <ConnectionRequiredMessage actionText={'download a project'}/>
          )}
          <FlatList
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={
              <View>
                {source === 'server' ? <OutlineButton onPress={getAllProjects} title={'Retry'}/>
                  : (
                    <ListEmptyText text={'No Projects Available'}/>
                  )}
                {isError && renderErrorMessage()}
              </View>
            }
            data={projectsArr.projects}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => renderProjectItem(item)}/>
        </View>
      );
    }
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <Loading isLoading={loading} style={{backgroundColor: themes.PRIMARY_BACKGROUND_COLOR}}/>
      {renderProjectsList()}
    </View>
  );
};

export default ProjectList;
