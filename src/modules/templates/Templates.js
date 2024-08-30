import React, {useEffect, useState} from 'react';
import { FlatList, Switch, Text, TextInput, View} from 'react-native';

import {Button, ListItem} from 'react-native-elements';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {getNewUUID, isEmpty, toTitleCase} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {formStyles} from '../form';
import MeasurementDetail from '../measurements/MeasurementDetail';
import {MEASUREMENT_KEYS} from '../measurements/measurements.constants';
import BasicPageDetail from '../page/BasicPageDetail';
import {MODAL_KEYS, MODALS, PET_PAGES, SED_PAGES} from '../page/page.constants';
import {addedTemplates, setActiveTemplates, setUseTemplate} from '../project/projects.slice';

const Templates = (props) => {
  const dispatch = useDispatch();
  const modalVisible = useSelector(state => state.home.modalVisible);
  const templates = useSelector(state => state.project.project?.templates);

  const [activeTemplatesForKey, setActiveTemplatesForKey] = useState([]);
  const [isShowForm, setIsShowForm] = useState(false);
  const [isShowNameInput, setIsShowNameInput] = useState(false);
  const [isTemplateInUse, setIsTemplateInUse] = useState(false);
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState({values: {}});
  const [templatesForKey, setTemplatesForKey] = useState([]);
  const [templateType, setTemplateType] = useState(null);

  let page = props.page || {};
  const measurementKey = 'measurementTemplates';
  let templateKey = page.key || undefined;
  if (isEmpty(page) && modalVisible) {
    page = MODALS.find(p => p.key === modalVisible);
    templateKey = modalVisible === MODAL_KEYS.NOTEBOOK.MEASUREMENTS
    || modalVisible === MODAL_KEYS.SHORTCUTS.MEASUREMENT ? measurementKey
      : modalVisible === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_IGNEOUS
      || modalVisible === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_SEDIMENTARY ? props.rockKey
        : page.notebook_modal_key ? page.notebook_modal_key
          : modalVisible;
  }

  useEffect(() => {
    console.log('UE Templates [templates, templateKey, props.typeKey]', templates, templateKey, props.typeKey);
    if (templateKey === measurementKey) {
      setIsTemplateInUse(templates.useMeasurementTemplates || false);
      let activeTemplatesTemp = templates.activeMeasurementTemplates || [];
      let templatesForKeyTemp = templates.measurementTemplates || [];
      setTemplatesForKey(templatesForKeyTemp);
      setActiveTemplatesForKey(activeTemplatesTemp);
    }
    else {
      setIsTemplateInUse(templates[templateKey] && templates[templateKey].isInUse);
      setTemplatesForKey((templates[templateKey] && templates[templateKey].templates) || []);
      setActiveTemplatesForKey((templates[templateKey] && templates[templateKey].active) || []);
    }
  }, [templates, templateKey, props.typeKey]);

  const clearTemplate = () => {
    if (templateType === 'planar_orientation') {
      const activeLinearTemplates = getLinearTemplates(activeTemplatesForKey);
      dispatch(setActiveTemplates({key: templateKey, templates: activeLinearTemplates}));
    }
    else if (templateType === 'linear_orientation') {
      const activePlanarTabularTemplates = getPlanarTemplates(activeTemplatesForKey);
      dispatch(setActiveTemplates({key: templateKey, templates: activePlanarTabularTemplates}));
    }
    else dispatch(setActiveTemplates({key: templateKey, templates: []}));
    closeTemplates();
  };

  const closeTemplates = () => {
    setIsShowForm(false);
    props.setIsShowTemplates(false);
  };

  const continueToTemplateForm = () => {
    setIsShowNameInput(false);
    setIsShowForm(true);
  };

  const createNewTemplate = () => {
    setIsShowNameInput(true);
    setName('');
    if (templateKey === measurementKey) setSelectedTemplate({values: {type: templateType}});
    else if (modalVisible === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_IGNEOUS) {
      setSelectedTemplate({values: {igneous_rock_class: templateType}});
    }
    else setSelectedTemplate({values: {}});
  };

  const deleteTemplate = (template) => {
    clearTemplate();
    const updatedTemplates = templatesForKey.filter(t => t.id !== template.id);
    dispatch(addedTemplates({key: templateKey, templates: updatedTemplates}));
  };

  const deleteTemplateConfirm = () => {
    alert(
      'Delete Template',
      'Are you sure you want to delete ' + selectedTemplate.name + '?',
      [
        {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
        {text: 'OK', onPress: () => deleteTemplate(selectedTemplate)},
      ],
      {cancelable: false},
    );
  };

  const editTemplate = (template) => {
    setIsShowNameInput(true);
    setSelectedTemplate(template);
    setName(template.name);
  };

  const getPlanarTemplates = templatesToFilter => templatesToFilter.filter(
    t => t.values?.type === 'planar_orientation' || t.values?.type === 'tabular_orientation'
      || t.type === 'planar_orientation');

  const getLinearTemplates = templatesToFilter => templatesToFilter.filter(
    t => t.values?.type === 'linear_orientation' || t.type === 'linear_orientation');

  const renderFormFields = () => {
    return (
      <FlatList
        listKey={'form' + measurementKey}
        ListHeaderComponent={
          <View style={{flex: 1}}>
            {templateKey === measurementKey ? renderMeasurementsForm() : renderNonMeasurementsForm()}
          </View>
        }
      />
    );
  };

  const renderMeasurementsForm = () => {
    let values = JSON.parse(JSON.stringify(selectedTemplate.values));
    if (!values.type && selectedTemplate.subType) values.type = selectedTemplate.subType;
    else if (!values.type && selectedTemplate.type) values.type = selectedTemplate.type;
    return (
      <MeasurementDetail
        closeDetailView={() => setIsShowForm(false)}
        selectedAttitudes={[values]}
        saveTemplate={saveTemplate}
        deleteTemplate={deleteTemplateConfirm}
      />
    );
  };

  const renderNonMeasurementsForm = () => {
    const isPet = PET_PAGES.find(p => p.key === page.key);
    const isSed = SED_PAGES.find(p => p.key === page.key);
    const groupKey = isPet ? 'pet' : isSed ? 'sed' : 'general';
    return (
      <BasicPageDetail
        closeDetailView={() => setIsShowForm(false)}
        selectedFeature={selectedTemplate.values}
        page={page}
        groupKey={groupKey}
        saveTemplate={saveTemplate}
        deleteTemplate={deleteTemplateConfirm}
      />
    );
  };

  const renderTemplateListItem = (template) => {
    const isActive = activeTemplatesForKey.map(t => t.id).includes(template.id);
    return (
      <View>
        <ListItem
          onPress={() => setAsTemplate(template)}
          containerStyle={isActive ? commonStyles.listItemInverse : commonStyles.listItem}
        >
          <ListItem.Content>
            <ListItem.Title style={isActive ? commonStyles.listItemTitleInverse : commonStyles.listItemTitle}>
              {template.name}
            </ListItem.Title>
          </ListItem.Content>
          <Button
            titleStyle={isActive ? commonStyles.standardButtonTextInverse : commonStyles.standardButtonText}
            title={'Edit'}
            type={'save'}
            onPress={() => editTemplate(template)}
          />
        </ListItem>
      </View>
    );
  };

  const renderTemplatesList = () => {
    let label = modalVisible === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_IGNEOUS ? toTitleCase(templateKey) + ' Rock'
      : page.label_singular || toTitleCase(page.label).slice(0, -1) || 'Unknown';

    let relevantTemplates = templatesForKey;
    if (templateType === 'planar_orientation') {
      relevantTemplates = getPlanarTemplates(relevantTemplates);
      label = 'Planar';
    }
    else if (templateType === 'linear_orientation') {
      relevantTemplates = getLinearTemplates(relevantTemplates);
      label = 'Linear';
    }

    return (
      <>
        <FlatList
          listKey={JSON.stringify(relevantTemplates)}
          data={relevantTemplates}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => renderTemplateListItem(item)}
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={'There are no templates defined yet.'}/>}
        />
        <Button
          titleStyle={commonStyles.standardButtonText}
          title={'Done'}
          type={'clear'}
          onPress={closeTemplates}
        />
        {!isEmpty(relevantTemplates) && (
          <Button
            titleStyle={commonStyles.standardButtonText}
            title={'Clear Selected Template'}
            type={'clear'}
            onPress={clearTemplate}
          />
        )}
        <Button
          titleStyle={commonStyles.standardButtonText}
          title={'Define New ' + label + ' Template'}
          type={'clear'}
          onPress={createNewTemplate}
        />
      </>
    );
  };

  const renderTemplateNameInput = () => {
    return (
      <>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Button
            titleStyle={commonStyles.standardButtonText}
            title={'Cancel'}
            type={'clear'}
            onPress={() => setIsShowNameInput(false)}
          />
          <Button
            titleStyle={commonStyles.standardButtonText}
            title={'Continue'}
            type={'clear'}
            disabled={isEmpty(name)}
            onPress={() => continueToTemplateForm()}
          />
        </View>
        <View style={[commonStyles.listItemFormField, {backgroundColor: themes.SECONDARY_BACKGROUND_COLOR}]}>
          <View style={formStyles.fieldLabelContainer}>
            <Text style={formStyles.fieldLabel}>{'Template Name'}</Text>
          </View>
          <TextInput
            style={formStyles.fieldValue}
            onChangeText={value => setName(value)}
            value={name || ''}
            autoFocus={isEmpty(name)}
          />
        </View>
      </>
    );
  };

  const renderTemplatesSelected = () => {
    if (templateKey === measurementKey) {
      if (!props.typeKey || (props.typeKey && props.typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR)) {
        return (
          <>
            {renderTemplateSelection('planar_orientation')}
            {renderTemplateSelection('linear_orientation')}
          </>
        );
      }
      else return renderTemplateSelection(props.typeKey);
    }
    else {
      return (
        <>
          {renderTemplateSelection(templateKey)}
        </>
      );
    }
  };

  const renderTemplateSelection = (type) => {
    let activeTemplates = activeTemplatesForKey;
    let label = page.label_singular || toTitleCase(page.label).slice(0, -1) || 'Unknown';
    if (type === 'planar_orientation' || type === 'tabular_orientation') {
      activeTemplates = getPlanarTemplates(activeTemplatesForKey);
      label = 'Planar';
    }
    else if (type === 'linear_orientation') {
      activeTemplates = getLinearTemplates(activeTemplatesForKey);
      label = 'Linear';
    }
    else if (modalVisible === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_IGNEOUS) label = toTitleCase(type);

    const title = templateKey === measurementKey ? 'Select ' + label + ' Template' : 'Select ' + label + ' Template(s)';

    return (
      <View>
        {isEmpty(activeTemplates) ? (
            <ListItem containerStyle={{padding: 0, width: '100%', justifyContent: 'center'}}>
              <Button
                titleStyle={commonStyles.standardButtonText}
                title={title}
                type={'clear'}
                onPress={() => {
                  props.setIsShowTemplates(true);
                  setTemplateType(type);
                }}
              />
            </ListItem>
          )
          : (
            <FlatList
              data={activeTemplates}
              keyExtractor={item => item.id.toString()}
              listKey={'templates' + type}
              renderItem={({item}) =>
                <ListItem containerStyle={{padding: 0, paddingLeft: 10, paddingRight: 10}}>
                  <ListItem.Content>
                    <ListItem.Title style={commonStyles.listItemTitle}>
                      {item.name}
                    </ListItem.Title>
                  </ListItem.Content>
                  <Button
                    titleStyle={commonStyles.standardButtonText}
                    title={'Change'}
                    type={'clear'}
                    onPress={() => {
                      props.setIsShowTemplates(true);
                      setTemplateType(type);
                    }}
                  />
                </ListItem>
              }
            />
          )}
      </View>
    );
  };

  const renderTemplateToggle = () => {
    return (
      <View>
        <ListItem containerStyle={{padding: 0, paddingLeft: 10, paddingRight: 10}}>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>
              {'Use Template(s)?'}
            </ListItem.Title>
          </ListItem.Content>
          <Switch
            onValueChange={toggleUseTemplateSwitch}
            value={isTemplateInUse}
          />
        </ListItem>
        {isTemplateInUse && renderTemplatesSelected()}
      </View>
    );
  };

  const saveTemplate = (values) => {
    let templateObject;
    if (isEmpty(name)) alert('Template name empty', 'Provide a template name.');
    else {
      let existingTemplatesCopy = !isEmpty(templatesForKey) ? JSON.parse(JSON.stringify(templatesForKey)) : [];
      if (!isEmpty(selectedTemplate.id)) {
        templateObject = {
          'id': selectedTemplate.id,
          'name': name,
          'values': values,
        };
        existingTemplatesCopy = existingTemplatesCopy.filter(templateId => templateObject.id !== templateId.id);
      }
      else {
        templateObject = {
          'id': getNewUUID(),
          'name': name,
          'values': values,
        };
      }
      existingTemplatesCopy.push(templateObject);
      existingTemplatesCopy = existingTemplatesCopy.sort(
        (templateA, templateB) => templateA.name.localeCompare(templateB.name));
      dispatch(addedTemplates({key: templateKey, templates: existingTemplatesCopy}));

      // Update active templates so updated template becomes active
      const templatesUpdated = activeTemplatesForKey?.filter(t => t.id !== templateObject.id) || [];
      dispatch(setActiveTemplates({key: templateKey, templates: [...templatesUpdated, templateObject]}));

      closeTemplates();
    }
  };

  const setAsTemplate = (template) => {
    const activeTemplatesForKeyCopy = !isEmpty(activeTemplatesForKey)
      ? JSON.parse(JSON.stringify(activeTemplatesForKey)) : [];
    const foundTemplate = activeTemplatesForKeyCopy.find(t => t.id === template.id);
    if (foundTemplate) {
      const templatesUpdated = activeTemplatesForKeyCopy.filter(t => t.id !== template.id);
      dispatch(setActiveTemplates({key: templateKey, templates: templatesUpdated}));
    }
    else dispatch(setActiveTemplates({key: templateKey, templates: [...activeTemplatesForKeyCopy, template]}));
  };

  const toggleUseTemplateSwitch = (value) => {
    setIsTemplateInUse(value);
    dispatch(setUseTemplate({key: templateKey, bool: value}));
  };

  return (
    <>
      {props.isShowTemplates && isShowNameInput ? renderTemplateNameInput()
        : props.isShowTemplates && isShowForm ? renderFormFields()
          : props.isShowTemplates ? renderTemplatesList()
            : renderTemplateToggle()}
    </>
  );
};

export default Templates;
