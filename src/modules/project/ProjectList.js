import React, {useEffect, useState} from 'react';
import {AppState, FlatList, Text, View} from 'react-native';

import {Button, ListItem} from '@rn-vui/base';
import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';

import {doesBackupDirectoryExist} from './projects.slice';
import useProject from './useProject';
import {APP_DIRECTORIES} from '../../services/directories.constants';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import Loading from '../../shared/ui/Loading';
import SectionDivider from '../../shared/ui/SectionDivider';

const ProjectList = ({doRefresh, onProjectPress, source}) => {
  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline);
  const userData = useSelector(state => state.user);

  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectsArr, setProjectsArr] = useState([]);

  const {getAllDeviceProjects, getAllServerProjects} = useProject();

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

  const handleStateChange = async (state) => {
    if (state === 'active' && source === 'device') {
      getAllProjects().then(() => console.log('Updated Project List'));
    }
  };

  const getAllProjects = async () => {
    let projectsResponse;
    setLoading(true);
    if (source === 'server') {
      projectsResponse = await getAllServerProjects();
    }
    else if (source === 'device') {
      projectsResponse = await getAllDeviceProjects(APP_DIRECTORIES.BACKUP_DIR);
      console.log('Device Files', projectsResponse);
    }
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

  const renderErrorMessage = () => {
    return (
      <View>
        <Text style={{color: 'red', textAlign: 'center'}}>{errorMessage}</Text>
      </View>
    );
  };

  const renderProjectItem = (item) => {
    const modifiedTimeAndDate = moment.unix(item.modified_timestamp).format('MMM Do YYYY, h:mm a');
    return (
      <ListItem
        key={item.id}
        onPress={() => onProjectPress(item)}
        containerStyle={commonStyles.listItem}
        disabled={!isOnline.isConnected && source !== 'device'}
        disabledStyle={{backgroundColor: 'lightgrey'}}
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
          <View style={{paddingBottom: 0}}>
            <SectionDivider
              dividerText={source === 'device' ? 'Local Copies of Projects' : 'Projects on StraboSpot Server'}/>
          </View>
          <FlatList
            keyExtractor={item => item.id.toString()}
            data={projectsArr.projects}
            renderItem={({item}) => renderProjectItem(item)}
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={
              <View>
                {source === 'server' ? (
                  <Button
                    title={'Retry'}
                    onPress={() => getAllProjects()}
                    buttonStyle={{width: 80, alignSelf: 'center'}}
                  />
                ) : (
                  <ListEmptyText text={'No Projects Available'}/>
                )}
                {isError && renderErrorMessage()}
              </View>
            }/>
        </View>
      );
    }
  };

  return (
    <View style={{flex: 1}}>
      <Loading isLoading={loading} style={{backgroundColor: themes.PRIMARY_BACKGROUND_COLOR}}/>
      {renderProjectsList()}
    </View>
  );
};

export default ProjectList;
