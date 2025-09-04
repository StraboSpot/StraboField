import React, {useEffect, useRef, useState} from 'react';
import {FlatList, Pressable, SectionList, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {NOTEBOOK_PAGES, PRIMARY_PAGES} from './page.constants';
import usePage from './usePage';
import {isEmpty} from '../../shared/Helpers';
import {SwitchWrapper} from '../../shared/ui';
import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import uiStyles from '../../shared/ui/ui.styles';
import {Form, useForm} from '../form';
import {setModalVisible} from '../home/home.slice';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import notebookStyles from '../notebook-panel/notebook.styles';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const Overview = ({openMainMenuPanel}) => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const [isTraceSurfaceFeatureEnabled, setIsTraceSurfaceFeatureEnabled] = useState(false);
  const [isTraceSurfaceFeatureEdit, setIsTraceSurfaceFeatureEdit] = useState(false);

  const formRef = useRef(null);

  const {showErrors, validateForm} = useForm();
  const {getPopulatedPagesKeys} = usePage();

  const visiblePagesKeys = [...new Set([...PRIMARY_PAGES.map(p => p.key), ...getPopulatedPagesKeys(spot)])];
  const sections = visiblePagesKeys.reduce((acc, key) => {
    const page = NOTEBOOK_PAGES.find(p => p.key === key);
    if (page.overview_component) {
      const SectionOverview = page.overview_component;
      const sectionOverview = {
        title: page,
        data: [<SectionOverview key={key} openMainMenuPanel={openMainMenuPanel} page={page}/>],
      };
      return [...acc, sectionOverview];
    }
    else return acc;
  }, []);

  useEffect(() => {
    console.log('UE Overview [spot]', spot);
    setIsTraceSurfaceFeatureEnabled(!!(spot.properties.trace?.trace_feature || spot.properties.surface_feature));
    setIsTraceSurfaceFeatureEdit(false);
  }, [spot]);

  const cancelFormAndGo = () => {
    setIsTraceSurfaceFeatureEdit(false);
    if (isTraceSurfaceFeatureEnabled && !spot.properties.trace && !spot.properties.surface_feature) {
      setIsTraceSurfaceFeatureEnabled(false);
    }
  };

  const openPage = (page) => {
    dispatch(setNotebookPageVisible(page.key));
    if (page.modal) dispatch(setModalVisible({modal: page.modal}));
    else dispatch(setModalVisible({modal: null}));
  };

  // What happens after submitting the form is handled in saveFormAndGo since we want to show
  // an alert message if there are errors but this function won't be called if form is invalid
  const onSubmitForm = () => {
    console.log('In onSubmitForm');
  };

  const renderCancelSaveButtons = () => {
    return (
      <View>
        <SaveAndCancelButtons
          cancel={() => cancelFormAndGo()}
          save={() => saveFormAndGo()}
        />
      </View>
    );
  };

  const renderTraceSurfaceFeatureForm = () => {
    const formName = spot.geometry && (spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString')
      ? ['general', 'trace'] : ['general', 'surface_feature'];
    let initialValues = spot.properties.trace || spot.properties.surface_feature || {};
    if (spot.geometry && (spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString')) {
      initialValues = {...initialValues, 'trace_feature': true};
    }
    return (
      <View>
        {renderCancelSaveButtons()}
        <FlatList
          ListHeaderComponent={
            <View>
              <Formik
                component={formProps => Form({formName: formName, ...formProps})}
                enableReinitialize={true}
                initialStatus={{formName: formName}}
                initialValues={initialValues}
                innerRef={formRef}
                onSubmit={onSubmitForm}
                validate={values => validateForm({formName: formName, values: values})}
              />
            </View>
          }
        />
      </View>
    );
  };

  const renderSectionHeader = (page) => {
    return (
      <Pressable onPress={() => openPage(page)} style={uiStyles.sectionHeaderBackground}>
        <SectionDivider dividerText={page.label}/>
      </Pressable>
    );
  };

  const renderSections = () => {
    return (
      <SectionList
        ItemSeparatorComponent={FlatListItemSeparator}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => item}
        renderSectionHeader={({section: {title}}) => renderSectionHeader(title)}
        sections={sections}
        stickySectionHeadersEnabled={true}
      />
    );
  };

  const saveForm = async () => {
    try {
      await formRef.current.submitForm();
      const formValues = showErrors(formRef.current);
      console.log('Saving form data to Spot ...');
      if (spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString') {
        const traceValues = {...formValues, 'trace_feature': true};
        dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
        dispatch(editedSpotProperties({field: 'trace', value: traceValues}));
      }
      else if (spot.geometry.type === 'Polygon' || spot.geometry.type === 'MultiPolygon'
        || spot.geometry.type === 'GeometryCollection') {
        dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
        dispatch(editedSpotProperties({field: 'surface_feature', value: formValues}));
      }
      return Promise.resolve();
    }
    catch (e) {
      console.log('Error submitting form', e);
      return Promise.reject();
    }
  };

  const saveFormAndGo = () => {
    saveForm().then(() => {
      setIsTraceSurfaceFeatureEdit(false);
    }, () => {
      console.log('Error saving form data to Spot');
    });
  };

  const toggleTraceSurfaceFeature = () => {
    const continueToggleTraceSurfaceFeature = () => {
      setIsTraceSurfaceFeatureEnabled(!isTraceSurfaceFeatureEnabled);
      setIsTraceSurfaceFeatureEdit(!isTraceSurfaceFeatureEnabled);

      // If toggled off remove trace or surface feature
      if (isTraceSurfaceFeatureEnabled) {
        let field = 'surface_feature';
        if (spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString') field = 'trace';
        dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
        dispatch(editedSpotProperties({field: field, value: {}}));
      }
    };

    if (isTraceSurfaceFeatureEnabled && ((spot.properties.trace
        && !isEmpty(Object.keys(spot.properties.trace).filter(t => t !== 'trace_feature')))
      || spot.properties.surface_feature)) {
      let featureTypeText = spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString'
        ? 'Trace' : 'Surface';
      alert('Turn Off ' + featureTypeText + ' Feature Warning',
        'Turning off ' + featureTypeText.toLowerCase() + ' feature will delete all '
        + featureTypeText.toLowerCase() + ' feature data. Are you sure you want to continue?',
        [
          {text: 'No', style: 'cancel'},
          {text: 'Yes', onPress: continueToggleTraceSurfaceFeature},
        ],
        {cancelable: false},
      );
    }
    else continueToggleTraceSurfaceFeature();
  };

  return (
    <View style={{flex: 1}}>
      {spot.geometry && spot.geometry.type && (spot.geometry.type === 'LineString'
        || spot.geometry.type === 'MultiLineString' || spot.geometry.type === 'Polygon'
        || spot.geometry.type === 'MultiPolygon' || spot.geometry.type === 'GeometryCollection') && (
        <View style={notebookStyles.traceSurfaceFeatureContainer}>
          <View style={notebookStyles.traceSurfaceFeatureToggleContainer}>
            {(spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString')
              && <Text style={notebookStyles.traceSurfaceFeatureToggleText}>This is a trace feature</Text>}
            {(spot.geometry.type === 'Polygon' || spot.geometry.type === 'MultiPolygon'
                || spot.geometry.type === 'GeometryCollection')
              && <Text style={notebookStyles.traceSurfaceFeatureToggleText}>This is a surface feature</Text>}
            <SwitchWrapper onValueChange={toggleTraceSurfaceFeature} value={isTraceSurfaceFeatureEnabled}/>
          </View>
          <View>
            <Button
              disabled={!isTraceSurfaceFeatureEnabled}
              disabledTitleStyle={notebookStyles.traceSurfaceFeatureDisabledText}
              onPress={() => setIsTraceSurfaceFeatureEdit(true)}
              title={'Edit'}
              type={'clear'}
            />
          </View>
        </View>
      )}
      {isTraceSurfaceFeatureEdit ? renderTraceSurfaceFeatureForm() : renderSections()}
    </View>
  );
};

export default Overview;
