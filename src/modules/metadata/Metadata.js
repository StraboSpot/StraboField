import React, {useRef} from 'react';
import {FlatList} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {MEDIUMGREY} from '../../shared/styles.constants';
import SectionDivider from '../../shared/ui/SectionDivider';
import {DateInputField, NumberInputField} from '../form';
import PageHeader from '../page/PageHeader';
import {movedSpotIdBetweenDatasets} from '../project/projects.slice';

const Metadata = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const datasets = useSelector(state => state.project.datasets);
  const readOnlyDatasetsIds = useSelector(state => state.project.readOnlyDatasetsIds) || [];
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Local State */

  const metadataFormRef = useRef(null);

  /* Event Handlers */

  const handleDatasetChecked = (datasetChecked) => {
    if (!datasetChecked.spotIds?.includes(spot.properties.id)) {
      dispatch(movedSpotIdBetweenDatasets({toDatasetId: datasetChecked.id, spotId: spot.properties.id}));
    }
  };

  /* Render Functions */

  const renderDatasetItem = (dataset) => {
    const isChecked = dataset.spotIds?.includes(spot.properties.id);
    // A lock at either end blocks the move - the Spot's own isReadOnly disables every row, a read only
    // dataset only its own. rn-vui keeps disabled off the radio it draws, hence the fade
    const isDatasetReadOnly = readOnlyDatasetsIds.includes(dataset.id);
    return (
      <ListItem containerStyle={commonStyles.listItem} key={dataset.id.toString()}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{dataset.name}</ListItem.Title>
          <ListItem.Subtitle>
            {dataset.spotIds
              ? `(${dataset.spotIds.length} spot${dataset.spotIds.length !== 1 ? 's' : ''})`
              : '(0 spots)'}
          </ListItem.Subtitle>
        </ListItem.Content>
        {isDatasetReadOnly && <Icon color={MEDIUMGREY} name={'lock-closed'} type={'ionicon'}/>}
        <ListItem.CheckBox
          checked={isChecked}
          checkedIcon={'radiobox-marked'}
          disabled={isReadOnly || isDatasetReadOnly}
          disabledStyle={{opacity: 0.5}}
          iconType={'material-community'}
          onPress={() => handleDatasetChecked(dataset)}
          uncheckedIcon={'radiobox-blank'}
        />
      </ListItem>
    );
  };

  const renderDatasets = () => {
    return (
      <>
        <SectionDivider dividerText={'Datasets'}/>
        <FlatList
          data={Object.values(datasets)}
          renderItem={({item}) => renderDatasetItem(item)}
        />
      </>
    );
  };

  const renderMetadataForm = () => {
    return (
      <Formik
        enableReinitialize={true}
        initialValues={spot.properties}
        innerRef={metadataFormRef}
        onSubmit={values => console.log('Submitting form...', values)}
      >
        {() => (
          <>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={NumberInputField}
                  editable={false}
                  key={'id'}
                  label={'ID'}
                  name={'id'}
                />
              </ListItem.Content>
            </ListItem>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={DateInputField}
                  isDisplayOnly={true}
                  isShowTime={true}
                  key={'date'}
                  label={'Date Created'}
                  name={'date'}
                />
              </ListItem.Content>
            </ListItem>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={DateInputField}
                  isDisplayOnly={true}
                  isShowTime={true}
                  key={'modified_timestamp'}
                  label={'Date Last Modified'}
                  name={'modified_timestamp'}
                />
              </ListItem.Content>
            </ListItem>
          </>
        )}
      </Formik>
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

export default Metadata;
