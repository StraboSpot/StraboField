import React, {useRef} from 'react';
import {FlatList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import {DateInputField, NumberInputField} from '../form';
import ReturnToOverviewButton from '../page/ui/ReturnToOverviewButton';
import {movedSpotIdBetweenDatasets} from '../project/projects.slice';

const Metadata = () => {
  const dispatch = useDispatch();
  const datasets = useSelector(state => state.project.datasets);
  const spot = useSelector(state => state.spot.selectedSpot);

  const metadataFormRef = useRef(null);

  const handleDatasetChecked = (datasetChecked) => {
    if (!datasetChecked.spotIds?.includes(spot.properties.id)) {
      dispatch(movedSpotIdBetweenDatasets({toDatasetId: datasetChecked.id, spotId: spot.properties.id}));
    }
  };

  const renderMetadataForm = () => {
    return (
      <Formik
        initialValues={spot.properties}
        onSubmit={values => console.log('Submitting form...', values)}
        innerRef={metadataFormRef}
        enableReinitialize={true}
      >
        {() => (
          <>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={NumberInputField}
                  name={'id'}
                  label={'ID'}
                  key={'id'}
                  editable={false}
                />
              </ListItem.Content>
            </ListItem>
            <FlatListItemSeparator/>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={DateInputField}
                  name={'date'}
                  label={'Date Created'}
                  key={'date'}
                  isDisplayOnly={true}
                  isShowTime={true}
                />
              </ListItem.Content>
            </ListItem>
            <FlatListItemSeparator/>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={DateInputField}
                  name={'modified_timestamp'}
                  label={'Date Last Modified'}
                  key={'modified_timestamp'}
                  isDisplayOnly={true}
                  isShowTime={true}
                />
              </ListItem.Content>
            </ListItem>
          </>
        )}
      </Formik>
    );
  };

  const renderDatasetItem = (dataset) => {
    const isChecked = dataset.spotIds?.includes(spot.properties.id);
    return (
      <ListItem key={dataset.id.toString()} containerStyle={commonStyles.listItem}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{dataset.name}</ListItem.Title>
          <ListItem.Subtitle>
            {dataset.spotIds
              ? `(${dataset.spotIds.length} spot${dataset.spotIds.length !== 1 ? 's' : ''})`
              : '(0 spots)'}
          </ListItem.Subtitle>
        </ListItem.Content>
        <ListItem.CheckBox
          checked={isChecked}
          onPress={() => handleDatasetChecked(dataset)}
          iconType={'material-community'}
          checkedIcon={'radiobox-marked'}
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

  return (
    <FlatList
      ListHeaderComponent={
        <>
          <ReturnToOverviewButton/>
          <SectionDivider dividerText={'Metadata'}/>
          {renderMetadataForm()}
          {renderDatasets()}
        </>
      }
    />
  );
};

export default Metadata;
