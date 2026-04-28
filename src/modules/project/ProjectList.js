import React, {useEffect, useState} from 'react';
import {AppState, FlatList, Text, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';

import {doesBackupDirectoryExist} from './projects.slice';
import useProject from './useProject';
import {APP_DIRECTORIES} from '../../services/files/directories.constants';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {MEDIUMGREY} from '../../shared/styles.constants';
import * as themes from '../../shared/styles.constants';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import Loading from '../../shared/ui/Loading';

const ProjectList = ({doRefresh, onProjectPress, selectedButtonIndex, source}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline);
  const userData = useSelector(state => state.user);

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

  const filteredProjectsList = () => {
    const projects = projectsArr.projects ?? [];
    if (selectedButtonIndex === undefined) return projects;
    if (selectedButtonIndex === 0) return projects.filter(p => !p?.isCollaborativeProject);
    if (selectedButtonIndex === 1) return projects.filter(p => p?.isCollaborativeProject && p?.isOwner);
    if (selectedButtonIndex === 2) return projects.filter(p => p?.isCollaborativeProject && !p?.isOwner);
    return projects;
  };

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

  const getEmptyMessage = () => {
    if (selectedButtonIndex === 0) return 'No unshared projects found.';
    if (selectedButtonIndex === 1) return 'No projects shared by you found.';
    if (selectedButtonIndex === 2) return 'No projects shared with you found.';
    return 'No Projects Available';
  };

  /* Render Functions */

  const renderProjectItem = ({item}) => {
    const modifiedTimeAndDate = moment(item.modified_timestamp).format('MMM Do YYYY, h:mm a');
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        disabled={!isOnline.isConnected && source !== 'device'}
        disabledStyle={{backgroundColor: 'lightgrey'}}
        key={item.id}
        onPress={() => onProjectPress(item)}
      >
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>
            <Text>{source === 'server' ? item.name : item.fileName}</Text>
          </ListItem.Title>
          {modifiedTimeAndDate && modifiedTimeAndDate !== 'Invalid date' && (
            <ListItem.Subtitle style={commonStyles.listItemSubtitle}>
              Updated: {modifiedTimeAndDate}
            </ListItem.Subtitle>
          )}
        </ListItem.Content>
        {item.isReadOnly && <Icon color={MEDIUMGREY} name={'lock-closed'} size={20} type={'ionicon'}/>}
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <Loading isLoading={loading} style={{backgroundColor: themes.PRIMARY_BACKGROUND_COLOR}}/>
      {!isEmpty(userData) && (
        <View style={{flex: 1}}>
          <FlatList
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={
              <View>
                <ListEmptyText text={getEmptyMessage()}/>
                {source === 'server' && <OutlineButton onPress={getAllProjects} title={'Retry'}/>}
                {isError && <Text style={{color: 'red', textAlign: 'center'}}>{errorMessage}</Text>}
              </View>
            }
            data={filteredProjectsList()}
            keyExtractor={item => item.id.toString()}
            renderItem={renderProjectItem}/>
        </View>
      )}
    </View>
  );
};

export default ProjectList;
