import React, {useEffect, useState} from 'react';
import {FlatList, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import moment from 'moment/moment';
import {useSelector} from 'react-redux';

import MicroProjectPDFOverlay from './MicroProjectPDFOverlay';
import MicroProjectsStatusOverlay from './MicroProjectsStatusOverlay';
import useMicro from './useMicro';
import useMicroZips from './useMicroZips';
import {APP_DIRECTORIES} from '../../services/directories.constants';
import useDevice from '../../services/useDevice';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {LIGHTGREY, MEDIUMGREY, PRIMARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import Loading from '../../shared/ui/Loading';

const MicroProjectsList = () => {
  const {isConnected, isInternetReachable} = useSelector(state => state.connections.isOnline);
  const userData = useSelector(state => state.user);

  const [doc, setDoc] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectsArr, setProjectsArr] = useState([]);
  const [projectsExistsArr, setProjectsExistsArr] = useState([]);
  const [projectsUpdateAvailableArr, setProjectsUpdateAvailableArr] = useState([]);
  const [visible, setVisible] = useState(false);

  const {doesMicroProjectPDFExist, deleteFromDevice, getSavedMicroProjectModifiedTimestamp} = useDevice();
  const {getAllLocalMicroProjects, getAllServerMicroProjects} = useMicro();
  const {
    clearStatus,
    downloadZip,
    isLoadingWave,
    percentDone,
    showComplete,
    showLoadingBar,
  } = useMicroZips();

  useEffect(() => {
    console.log('UE ProjectList');
    return () => {
      closeStatusOverlay();
    };
  }, []);

  useEffect(() => {
    console.log('UE ProjectList [showComplete, isConnected, isInternetReachable]');
    getAllMicroProjects().then(() => console.log('OK got projects'));
  }, [showComplete, isConnected, isInternetReachable]);

  const checkForMicroProject = async (item, i) => {
    if (!projectsExistsArr[i] || (isConnected && isInternetReachable && projectsUpdateAvailableArr[i])) {
      console.log('Need to download project');
      try {
        await downloadZip(item.id);
      }
      catch (err) {
        clearStatus();
        setIsError(true);
        setErrorMessage(err.message);
      }
    }
    else {
      console.log('PDF available');
      setDoc({
        id: item.id,
        platform: ['ios', 'android'],
        label: 'StraboMicroProject',
        name: item.name,
        file: {uri: APP_DIRECTORIES.MICRO + item.id + '/' + 'project.pdf'},
      });
      setVisible(true);
    }
  };

  const closeStatusOverlay = () => {
    setIsError(false);
    setErrorMessage(null);
    clearStatus();
  };

  const getAllMicroProjects = async () => {
    // await deleteFromDevice(APP_DIRECTORIES.MICRO);   // Just needed for testing

    let projectsResponse;
    setLoading(true);
    if (isConnected && isInternetReachable) {
      projectsResponse = await getAllServerMicroProjects();
      if (!projectsResponse || !projectsResponse.projects) setErrorMessage('Error Getting StraboMicro Projects');
      else if (isEmpty(projectsResponse.projects)) setErrorMessage('No StraboMico Projects');
      else {
        setIsError(false);
        console.log('List of Projects:', projectsResponse);
        setProjectsArr(projectsResponse);
        let projectsExistsArrTemp = [];
        let projectsExistsUpdateAvailableTemp = [];
        await Promise.all(projectsResponse.projects.map(async (project, i) => {
          const exists = await doesMicroProjectPDFExist(project.id);
          projectsExistsArrTemp[i] = exists;
          if (exists) {
            // console.log('server project', project);
            const modifiedTimestamp = await getSavedMicroProjectModifiedTimestamp(project.id);
            if (modifiedTimestamp && project.modifiedtimestamp > modifiedTimestamp) {
              projectsExistsUpdateAvailableTemp[i] = true;
            }
            else projectsExistsUpdateAvailableTemp[i] = false;
          }
        }));
        setProjectsExistsArr(projectsExistsArrTemp);
        setProjectsUpdateAvailableArr(projectsExistsUpdateAvailableTemp);
      }
    }
    else {
      projectsResponse = await getAllLocalMicroProjects();
      if (!projectsResponse || !projectsResponse.projects) {
        setErrorMessage('No Offline StraboMicro Projects Found');
      }
      else {
        setIsError(false);
        console.log('List of Projects:', projectsResponse);
        setProjectsArr(projectsResponse);
        setProjectsExistsArr(Array(projectsResponse.projects.length).fill(true));
      }
    }
    setLoading(false);
  };

  const renderMicroProjectItem = (item, i) => {
    const modifiedTimeAndDate = moment.unix(item.modifiedtimestamp / 1000).format('MMM Do YYYY, h:mm a');
    return (
      <ListItem
        key={item.id}
        onPress={() => checkForMicroProject(item, i)}
        containerStyle={commonStyles.listItem}
        disabled={!isConnected && !projectsExistsArr[i]}
        disabledStyle={{backgroundColor: LIGHTGREY}}
      >
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{item.name}</ListItem.Title>
          {modifiedTimeAndDate && modifiedTimeAndDate !== 'Invalid date' && (
            <ListItem.Subtitle style={commonStyles.listItemSubtitle}>Updated: {modifiedTimeAndDate}</ListItem.Subtitle>
          )}
        </ListItem.Content>
        {isConnected && isInternetReachable && projectsUpdateAvailableArr[i] ? (
            <Icon
              name={'sync'}
              type={'material-community'}
              size={20}
              color={MEDIUMGREY}
            />
          )
          : projectsExistsArr[i] ? <ListItem.Chevron/> : (
            <Icon
              name={'download-circle-outline'}
              type={'material-community'}
              size={20}
              color={MEDIUMGREY}
            />
          )}
      </ListItem>
    );
  };

  const renderMicroProjectsList = () => {
    if (!isEmpty(userData)) {
      return (
        <View style={{flex: 1}}>
          <FlatList
            keyExtractor={item => item.id.toString()}
            data={projectsArr.projects}
            renderItem={({item, index}) => renderMicroProjectItem(item, index)}
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText text={errorMessage}/>}/>
        </View>
      );
    }
  };

  return (
    <View style={{flex: 1}}>
      <Loading isLoading={loading} style={{backgroundColor: PRIMARY_BACKGROUND_COLOR}}/>
      {renderMicroProjectsList()}
      <MicroProjectsStatusOverlay
        closeStatusOverlay={closeStatusOverlay}
        errorMessage={errorMessage}
        isError={isError}
        isLoadingWave={isLoadingWave}
        percentDone={percentDone}
        showComplete={showComplete}
        showLoadingBar={showLoadingBar}
      />
      <MicroProjectPDFOverlay doc={doc} visible={visible} setVisible={setVisible}/>
    </View>
  );
};

export default MicroProjectsList;
