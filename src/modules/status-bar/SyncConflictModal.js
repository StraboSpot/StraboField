import React, {useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

import {Button, Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {BACKUP_ICON_NAMES, ICON_TYPE} from './statusBarIcon.constants';
import useDownload from '../../services/files/useDownload';
import useUpload from '../../services/files/useUpload';
import commonStyles from '../../shared/common.styles';
import {PRIMARY_ACCENT_COLOR, SMALL_TEXT_SIZE, WARNING_COLOR} from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../shared/ui/SectionDivider';
import {setIsSyncConflictModalVisible} from '../home/home.slice';

const SyncConflictModal = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const conflictedDatasetIds = useSelector(state => state.connections.conflictedDatasetIds);
  const datasets = useSelector(state => state.project.datasets);
  const isProjectConflicted = useSelector(state => state.connections.isProjectConflicted);
  const isVisible = useSelector(state => state.home.isSyncConflictModalVisible);
  const project = useSelector(state => state.project.project);

  const {keepServerConflict, keepServerProject} = useDownload();
  const {keepDeviceConflict, keepDeviceProject} = useUpload();

  /* Derived Variables */

  const projectName = project?.description?.project_name || 'Project';
  // Total conflicts across the project and all datasets, so we know when the last one is resolved.
  const conflictCount = conflictedDatasetIds.length + (isProjectConflicted ? 1 : 0);

  /* Local State */

  // Id currently being resolved, so we can disable that row's buttons and show a spinner.
  const [resolvingId, setResolvingId] = useState(null);

  /* Event Handlers */

  const handleClose = () => dispatch(setIsSyncConflictModalVisible(false));

  const handleResolve = async (datasetId, keep) => {
    setResolvingId(datasetId);
    try {
      if (keep === 'device') await keepDeviceConflict(datasetId);
      else await keepServerConflict(datasetId);
      // Close once this was the last conflict to resolve.
      if (conflictCount <= 1) handleClose();
    }
    catch (err) {
      console.error('Error resolving sync conflict:', err);
    }
    finally {
      setResolvingId(null);
    }
  };

  const handleResolveProject = async (keep) => {
    setResolvingId('project');
    try {
      if (keep === 'device') await keepDeviceProject();
      else await keepServerProject();
      if (conflictCount <= 1) handleClose();
    }
    catch (err) {
      console.error('Error resolving project sync conflict:', err);
    }
    finally {
      setResolvingId(null);
    }
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={handleClose}
      headerTitle={'Resolve Sync Conflicts'}
      isVisible={isVisible}
      onBackdropPress={handleClose}
      overlayStyleOverride={{height: 'auto'}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton
    >
      <Text style={[commonStyles.listItemTitle, styles.intro]}>
        These items were changed on both this device and the server. Choose which copy to keep for each.
        The copy you don't keep will be overwritten.
      </Text>
      {isProjectConflicted && (
        <View key={'project'}>
          <SectionDivider
            dividerText={'Project: ' + projectName}
            leftIcon={<Icon color={WARNING_COLOR} name={BACKUP_ICON_NAMES.CONFLICT} size={18} type={ICON_TYPE}/>}
          />
          {resolvingId === 'project' ? (
            <View style={styles.resolvingRow}>
              <ActivityIndicator color={PRIMARY_ACCENT_COLOR} size={'small'}/>
              <Text style={[commonStyles.listItemTitle, {paddingLeft: 8}]}>Resolving…</Text>
            </View>
          )
            : (
              <View style={styles.buttonRow}>
                <Button
                  buttonStyle={styles.button}
                  disabled={!!resolvingId}
                  onPress={() => handleResolveProject('device')}
                  title={'Keep Device'}
                  titleStyle={styles.buttonTitle}
                  type={'outline'}
                />
                <Button
                  buttonStyle={styles.button}
                  disabled={!!resolvingId}
                  onPress={() => handleResolveProject('server')}
                  title={'Keep Server'}
                  titleStyle={styles.buttonTitle}
                  type={'outline'}
                />
              </View>
            )}
        </View>
      )}
      {conflictedDatasetIds.map((id) => {
        const isResolving = String(resolvingId) === String(id);
        return (
          <View key={id}>
            <SectionDivider
              dividerText={datasets[id]?.name || `Dataset ${id}`}
              leftIcon={<Icon color={WARNING_COLOR} name={BACKUP_ICON_NAMES.CONFLICT} size={18} type={ICON_TYPE}/>}
            />
            {isResolving ? (
              <View style={styles.resolvingRow}>
                <ActivityIndicator color={PRIMARY_ACCENT_COLOR} size={'small'}/>
                <Text style={[commonStyles.listItemTitle, {paddingLeft: 8}]}>Resolving…</Text>
              </View>
            )
              : (
                <View style={styles.buttonRow}>
                  <Button
                    buttonStyle={styles.button}
                    disabled={!!resolvingId}
                    onPress={() => handleResolve(id, 'device')}
                    title={'Keep Device'}
                    titleStyle={styles.buttonTitle}
                    type={'outline'}
                  />
                  <Button
                    buttonStyle={styles.button}
                    disabled={!!resolvingId}
                    onPress={() => handleResolve(id, 'server')}
                    title={'Keep Server'}
                    titleStyle={styles.buttonTitle}
                    type={'outline'}
                  />
                </View>
              )}
          </View>
        );
      })}
      {conflictCount === 0 && (
        <Text style={commonStyles.noValueText}>No sync conflicts to resolve.</Text>
      )}
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  buttonTitle: {
    color: PRIMARY_ACCENT_COLOR,
    fontSize: SMALL_TEXT_SIZE,
  },
  intro: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  resolvingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});

export default SyncConflictModal;
