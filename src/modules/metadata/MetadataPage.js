import React, {useRef} from 'react';
import {FlatList} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {MEDIUMGREY} from '../../shared/styles.constants';
import SectionDivider from '../../shared/ui/SectionDivider';
import FormikWrapper from '../form/FormikWrapper';
import DateInputField from '../form/inputs/DateInputField';
import NumberInputField from '../form/inputs/NumberInputField';
import PageHeader from '../page/PageHeader';
import {movedSpotIdBetweenDatasets} from '../project/projects.slice';
import useProject from '../project/useProject';
import {canMoveSampleToDataset, getSampleParent, getSpotIdsToMove, isSplitFromParent} from '../samples/samples.helpers';
import {getSpotsCount, isAnySpotIdInReadOnlyDataset, isSpotIdInDataset} from '../spots/spots.helpers';

const MetadataPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const datasets = useSelector(state => state.project.datasets);
  const spot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);
  const straboUserId = useSelector(state => state.user.straboUserId);

  const {isReadOnlyDataset, isSpotInReadOnlyDataset} = useProject();

  /* Local State */

  const metadataFormRef = useRef(null);

  /* Derived Variables */

  // A Spot moves together with its samples, so one of them held by a read only dataset holds the Spot there too.
  // getSpotIdsToMove lists the Spot's own id first, then its samples'.
  const spotIdsToMove = getSpotIdsToMove(spot, spots);
  const hasReadOnlySample = isAnySpotIdInReadOnlyDataset(spotIdsToMove.slice(1), datasets, straboUserId);
  const isHeldByReadOnlyDataset = isAnySpotIdInReadOnlyDataset(spotIdsToMove, datasets, straboUserId);

  // A map edit used to add the Spot to the target dataset as well, so it can show as in more than one. Picking any of
  // them then moves it there alone.
  const isInSeveralDatasets = Object.values(datasets).filter(isSpotInDataset).length > 1;

  const isSample = !!spot.properties.isSample;
  const parentSpot = isSample && getSampleParent(spot, spots);
  const isSplit = isSample && isSplitFromParent(spot, parentSpot, datasets);

  /* Event Handlers */

  const handleDatasetChecked = (datasetChecked) => {
    if (!isSpotInDataset(datasetChecked) || isInSeveralDatasets) {
      dispatch(movedSpotIdBetweenDatasets({spotIds: spotIdsToMove, straboUserId: straboUserId,
        toDatasetId: datasetChecked.id}));
    }
  };

  /* Logic Helpers */

  // A split Sample may only go back to its parent's dataset, and when that is read only there is nothing to pick
  const getDatasetNote = () => {
    if (isSplit && isSpotInReadOnlyDataset(parentSpot.properties.id)) {
      return 'This Sample is apart from the Spot it was taken from, whose dataset is read only, so it can\'t be moved.';
    }
    if (isSplit) return 'This Sample is apart from the Spot it was taken from. Pick that Spot\'s dataset.';
    if (isSample) return 'A Sample moves with the Spot it was taken from. Move that Spot to change the dataset.';
    if (hasReadOnlySample) {
      return 'A Sample taken from this Spot is in a read only dataset, so the Spot can\'t be moved.';
    }
    return null;
  };

  function isSpotInDataset(dataset) { return isSpotIdInDataset(dataset, spot.properties.id); }

  /* Render Functions */

  const renderDatasetItem = (dataset) => {
    const isChecked = isSpotInDataset(dataset);
    // A lock at either end blocks the move - the Spot's own isReadOnly disables every row, a read only dataset only
    // its own, and a sample held by one every row. Those last two are the halves of canMoveSpotIdsToDataset, so the
    // rows refuse exactly what the reducer would. A Sample can only be put back with its parent. rn-vui keeps
    // disabled off the radio it draws, hence the fade
    const isDatasetReadOnly = isReadOnlyDataset(dataset.id);
    const isBlockedForSample = isSample && !canMoveSampleToDataset(isSplit, parentSpot, dataset);
    const spotsCount = getSpotsCount(dataset.spotIds, spots);
    return (
      <ListItem containerStyle={commonStyles.listItem} key={dataset.id.toString()}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{dataset.name}</ListItem.Title>
          <ListItem.Subtitle>{`(${spotsCount} spot${spotsCount !== 1 ? 's' : ''})`}</ListItem.Subtitle>
        </ListItem.Content>
        {isDatasetReadOnly && <Icon color={MEDIUMGREY} name={'lock-closed'} type={'ionicon'}/>}
        <ListItem.CheckBox
          checked={isChecked}
          checkedIcon={'radiobox-marked'}
          disabled={isReadOnly || isBlockedForSample || isDatasetReadOnly || isHeldByReadOnlyDataset}
          disabledStyle={{opacity: 0.5}}
          iconType={'material-community'}
          onPress={() => handleDatasetChecked(dataset)}
          uncheckedIcon={'radiobox-blank'}
        />
      </ListItem>
    );
  };

  const renderDatasets = () => {
    const datasetNote = getDatasetNote();
    return (
      <>
        <SectionDivider dividerText={'Datasets'}/>
        {!isReadOnly && datasetNote && (
          <ListItem containerStyle={commonStyles.listItem}>
            <ListItem.Content>
              <ListItem.Subtitle style={commonStyles.listItemSubtitle}>
                {datasetNote}
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        )}
        <FlatList
          data={Object.values(datasets)}
          renderItem={({item}) => renderDatasetItem(item)}
        />
      </>
    );
  };

  const renderMetadataForm = () => {
    return (
      <FormikWrapper
        enableReinitialize={true}
        initialValues={spot.properties}
        innerRef={metadataFormRef}
      >
        <>
          <ListItem containerStyle={commonStyles.listItemFormField}>
            <ListItem.Content>
              <NumberInputField
                editable={false}
                label={'ID'}
                name={'id'}
              />
            </ListItem.Content>
          </ListItem>
          <ListItem containerStyle={commonStyles.listItemFormField}>
            <ListItem.Content>
              <DateInputField
                isDisplayOnly={true}
                isShowTime={true}
                label={'Date Created'}
                name={'date'}
              />
            </ListItem.Content>
          </ListItem>
          <ListItem containerStyle={commonStyles.listItemFormField}>
            <ListItem.Content>
              <DateInputField
                isDisplayOnly={true}
                isShowTime={true}
                label={'Date Last Modified'}
                name={'modified_timestamp'}
              />
            </ListItem.Content>
          </ListItem>
        </>
      </FormikWrapper>
    );
  };

  /* View */

  return (
    <FlatList
      ListHeaderComponent={
        <>
          <PageHeader pageTitle={page.label}/>
          {renderMetadataForm()}
          {renderDatasets()}
        </>
      }
    />
  );
};

export default MetadataPage;
