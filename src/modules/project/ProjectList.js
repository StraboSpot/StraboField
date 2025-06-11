import React, {useEffect, useState} from 'react';
import {AppState, FlatList, Text, View} from 'react-native';

import {Button, ListItem} from '@rn-vui/base';
import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';

import ProjectOptionsDialogBox from './modals/project-options-modal/ProjectOptionsModal';
import {doesBackupDirectoryExist, setSelectedProject} from './projects.slice';
import useProject from './useProject';
import {APP_DIRECTORIES} from '../../services/directories.constants';
import useDownload from '../../services/useDownload';
import useImport from '../../services/useImport';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import Loading from '../../shared/ui/Loading';
import SectionDivider from '../../shared/ui/SectionDivider';
import {
  setIsProjectLoadSelectionModalVisible,
  setIsStatusMessagesModalVisible,
  setLoadingStatus,
  setStatusMessageModalTitle,
} from '../home/home.slice';

const ProjectList = ({source}) => {
  const dispatch = useDispatch();
  const currentProject = useSelector(state => state.project.project);
  const endPoint = useSelector(state => state.connections.databaseEndpoint);
  const isInitialProjectLoadModalVisible = useSelector(state => state.home.isProjectLoadSelectionModalVisible);
  const isOnline = useSelector(state => state.connections.isOnline);
  const userData = useSelector(state => state.user);

  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isProjectOptionsModalVisible, setIsProjectOptionsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectsArr, setProjectsArr] = useState([]);

  const {initializeDownload} = useDownload();
  const {loadProjectFromDevice} = useImport();
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
    console.log('Project Options Modal Visible', isProjectOptionsModalVisible);
    return () => {
      setIsProjectOptionsModalVisible(false);
      console.log('Project Options Modal Visible (in return)', isProjectOptionsModalVisible);
    };
  }, []);

  const handleStateChange = async (state) => {
    state === 'active'
    && source === 'device'
    && getAllProjects().then(() => console.log('Updated Project List'));
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

  const reloadingList = async (isDeleted) => {
    if (isDeleted) {
      if (source === 'server') setProjectsArr(await getAllServerProjects());
      else if (source === 'device') {
        const newArr = await getAllDeviceProjects(APP_DIRECTORIES.BACKUP_DIR);
        setProjectsArr(newArr);
      }
    }
    else console.log('Project was not deleted.');
  };

  const initializeProjectOptions = async (project) => {
    // const projectName;
    dispatch(setSelectedProject({project: project, source: source}));
    if (isInitialProjectLoadModalVisible || isEmpty(currentProject)) {
      dispatch(setSelectedProject({project: '', source: ''}));
      const res = await loadSelectedProject(project);
      console.log('Done loading project from InitialProjectModal', res);
    }
    else setIsProjectOptionsModalVisible(true);
  };

  const loadSelectedProject = async (project) => {
    try {
      console.log('Selected Project:', project);
      setLoading(true);
      if (!isEmpty(currentProject)) dispatch(setSelectedProject({project: project, source: source}));
      else {
        console.log('Getting project...');
        if (source === 'device') {
          dispatch(setIsProjectLoadSelectionModalVisible(false));
          dispatch(setLoadingStatus({view: 'modal', bool: true}));
          dispatch(setIsStatusMessagesModalVisible(true));
          const res = await loadProjectFromDevice(project.fileName);
          setLoading(false);
          dispatch(setStatusMessageModalTitle(res.project.description.project_name));
          dispatch(setLoadingStatus({view: 'modal', bool: false}));
          console.log('Done loading project', res);
        }
        else await initializeDownload(project);
      }
    }
    catch (err) {
      console.error('Error loading Project.', err);
      alert('Project not found!', 'Make sure there is a "data.json" file and it is properly named.');
      dispatch(setLoadingStatus({view: 'modal', bool: false}));
      setLoading(false);
      dispatch(setIsStatusMessagesModalVisible(false));
    }
  };

  const renderProjectOptionsModal = () => {
    return (
      <ProjectOptionsDialogBox
        currentProject={currentProject}
        endpoint={endPoint}
        visible={isProjectOptionsModalVisible}
        closeModal={() => setIsProjectOptionsModalVisible(false)}
        open={() => setIsProjectOptionsModalVisible(true)}
        projectDeleted={value => reloadingList(value)}
      />
    );
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
        onPress={() => initializeProjectOptions(item)}
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
            <SectionDivider dividerText={source === 'device' ? 'Saved Projects' : 'Projects to Import'}/>
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
                  )
                  : <ListEmptyText text={'No Projects Available'}/>
                }
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
      {renderProjectOptionsModal()}
    </View>
  );
};

export default ProjectList;
