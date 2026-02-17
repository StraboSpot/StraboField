import React, {useEffect, useRef, useState} from 'react';
import {FlatList, ScrollView, Text, TextInput, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {MEASUREMENT_TEMPLATE_KEY} from './templates.constants';
import {getLinearTemplates, getPlanarTemplates} from './templates.helpers';
import commonStyles from '../../shared/common.styles';
import {getNewUUID, isEmpty, toTitleCase} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui';
import alert from '../../shared/ui/alert';
import buttonsStyles from '../../shared/ui/buttons/buttons.styles';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {formStyles} from '../form';
import MeasurementDetail from '../measurements/MeasurementDetail';
import {MEASUREMENT_KEYS} from '../measurements/measurements.constants';
import NoteForm from '../notes/NoteForm';
import BasicPageDetail from '../page/BasicPageDetail';
import {MODALS, PET_PAGES, SED_PAGES} from '../page/page.constants';
import {MODAL_KEYS} from '../page/pageKeys.constants';
import {addedTemplates, setActiveTemplates, setUseTemplate} from '../project/projects.slice';

const TemplatesNotebook = ({
                             isShowTemplates,
                             page = {},
                             rockKey,
                             setIsShowTemplates,
                             typeKey,
                           }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const modalVisible = useSelector(state => state.home.modalVisible);
  const templates = useSelector(state => state.project.project?.templates);

  /* Local State */

  const notesTemplateFormRef = useRef(null);

  const [activeTemplatesForKey, setActiveTemplatesForKey] = useState([]);
  const [isShowForm, setIsShowForm] = useState(false);
  const [isShowNameInput, setIsShowNameInput] = useState(false);
  const [isTemplateInUse, setIsTemplateInUse] = useState(false);
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState({values: {}});
  const [templatesForKey, setTemplatesForKey] = useState([]);
  const [templateType, setTemplateType] = useState(null);

  /* Derived Variables */

  let templateKey = page.key || undefined;
  if (isEmpty(page) && modalVisible) {
    page = MODALS.find(p => p.key === modalVisible);
    templateKey = modalVisible === MODAL_KEYS.NOTEBOOK.MEASUREMENTS
    || modalVisible === MODAL_KEYS.SHORTCUTS.MEASUREMENT ? MEASUREMENT_TEMPLATE_KEY
      : modalVisible === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_IGNEOUS
      || modalVisible === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_SEDIMENTARY ? rockKey
        : page.notebook_modal_key ? page.notebook_modal_key
          : modalVisible;
  }

  /* Side Effects */

  useEffect(() => {
    console.log('UE TemplatesNotebook [templates, templateKey, typeKey]', templates, templateKey, typeKey);
    if (templateKey === MEASUREMENT_TEMPLATE_KEY) {
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
  }, [templates, templateKey, typeKey]);

  /* Logic Helpers */

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
    setIsShowTemplates(false);
  };

  const continueToTemplateForm = () => {
    setIsShowNameInput(false);
    setIsShowForm(true);
  };

  const createNewTemplate = () => {
    setIsShowNameInput(true);
    setName('');
    if (templateKey === MEASUREMENT_TEMPLATE_KEY) setSelectedTemplate({values: {type: templateType}});
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

  /* Render Functions */

  const renderFormFields = () => {
    return (
      <FlatList
        ListHeaderComponent={
          <View style={{flex: 1}}>
            {templateKey === MEASUREMENT_TEMPLATE_KEY ? renderMeasurementsForm() : renderNonMeasurementsForm()}
          </View>
        }
        listKey={'form' + MEASUREMENT_TEMPLATE_KEY}
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
        deleteTemplate={deleteTemplateConfirm}
        saveTemplate={saveTemplate}
        selectedAttitudes={[values]}
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
        deleteTemplate={deleteTemplateConfirm}
        groupKey={groupKey}
        page={page}
        saveTemplate={saveTemplate}
        selectedFeature={selectedTemplate.values}
      />
    );
  };

  const renderNotesForm = () => {
    return (
      <ScrollView>
        <SaveAndCancelButtons
          cancel={() => setIsShowForm(false)}
          save={() => saveTemplate(notesTemplateFormRef.current.values)}
        />
        <NoteForm
          appearance={'multiline'}
          customHeight={300}
          formRef={notesTemplateFormRef}
          initialNotesValues={selectedTemplate.values}
        />
      </ScrollView>
    );
  };

  const renderNotesTemplateModal = () => {
    return (
      <ModalWrapper
        closeModal={closeTemplates}
        headerTitle={isShowForm || isShowNameInput ? 'Edit Notes Template' : 'Notes TemplatesNotebook'}
        onActionPressed={() => isShowForm && saveTemplate(notesTemplateFormRef.current.values)}
        onCancelPress={() => setIsShowForm(false)}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        {isShowNameInput ? renderTemplateNameInput()
          : isShowForm ? renderNotesForm()
            : renderTemplatesList()}
      </ModalWrapper>
    );
  };

  const renderTemplateListItem = (template) => {
    const isActive = activeTemplatesForKey.map(t => t.id).includes(template.id);
    return (
      <View>
        <ListItem
          containerStyle={isActive ? commonStyles.listItemInverse : commonStyles.listItem}
          onPress={() => setAsTemplate(template)}
        >
          <ListItem.Content>
            <ListItem.Title style={isActive ? commonStyles.listItemTitleInverse : commonStyles.listItemTitle}>
              {template.name}
            </ListItem.Title>
          </ListItem.Content>
          <ClearButton
            onPress={() => editTemplate(template)}
            title={'Edit'}
            titleProps={{style: isActive ? buttonsStyles.standardButtonTextInverse : buttonsStyles.standardButtonText}}
            type={'save'}
          />
        </ListItem>
      </View>
    );
  };

  const renderTemplateNameInput = () => {
    return (
      <>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <ClearButton onPress={() => setIsShowNameInput(false)} title={'Cancel'}/>
          <ClearButton disabled={isEmpty(name)} onPress={() => continueToTemplateForm()} title={'Continue'}/>
        </View>
        <View style={[commonStyles.listItemFormField, {backgroundColor: themes.SECONDARY_BACKGROUND_COLOR}]}>
          <View style={formStyles.fieldLabelContainer}>
            <Text style={formStyles.fieldLabel}>{'Template Name'}</Text>
          </View>
          <TextInput
            autoFocus={isEmpty(name)}
            onChangeText={value => setName(value)}
            style={formStyles.fieldValue}
            value={name || ''}
          />
        </View>
      </>
    );
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

    const title = templateKey === MEASUREMENT_TEMPLATE_KEY ? 'Select ' + label + ' Template'
      : 'Select ' + label + ' Template(s)';

    return (
      <View>
        {isEmpty(activeTemplates) ? (
          <ListItem containerStyle={{padding: 0, width: '100%', justifyContent: 'center'}}>
            <ClearButton
              onPress={() => {
                setIsShowTemplates(true);
                setTemplateType(type);
              }}
              title={title}
            />
          </ListItem>
        ) : (
          <FlatList
            data={activeTemplates}
            keyExtractor={item => item.id.toString()}
            listKey={'templates' + type}
            renderItem={({item}) =>
              <ListItem containerStyle={{padding: 0, paddingLeft: 10}}>
                <ListItem.Content>
                  <ListItem.Title style={commonStyles.listItemTitle}>
                    {item.name}
                  </ListItem.Title>
                </ListItem.Content>
                <ClearButton
                  onPress={() => {
                    setIsShowTemplates(true);
                    setTemplateType(type);
                  }}
                  title={'Change'}
                />
              </ListItem>
            }
          />
        )}
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
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={'There are no templates defined yet.'}/>}
          data={relevantTemplates}
          keyExtractor={item => item.id.toString()}
          listKey={JSON.stringify(relevantTemplates)}
          renderItem={({item}) => renderTemplateListItem(item)}
        />
        <ClearButton onPress={closeTemplates} title={'Done'}/>
        {!isEmpty(relevantTemplates) && <ClearButton onPress={clearTemplate} title={'Clear Selected Template'}/>}
        <ClearButton onPress={createNewTemplate} title={'Define New ' + label + ' Template'}/>
      </>
    );
  };

  const renderTemplatesSelected = () => {
    if (templateKey === MEASUREMENT_TEMPLATE_KEY) {
      if (!typeKey || (typeKey && typeKey === MEASUREMENT_KEYS.PLANAR_LINEAR)) {
        return (
          <>
            {renderTemplateSelection('planar_orientation')}
            {renderTemplateSelection('linear_orientation')}
          </>
        );
      }
      else return renderTemplateSelection(typeKey);
    }
    else return renderTemplateSelection(templateKey);
  };

  const renderTemplateToggle = () => {
    return (
      <View>
        <ListItem containerStyle={{padding: 10}}>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>
              {'Use Template(s)?'}
            </ListItem.Title>
          </ListItem.Content>
          <SwitchWrapper onValueChange={toggleUseTemplateSwitch} value={isTemplateInUse}/>
        </ListItem>
        {isTemplateInUse && renderTemplatesSelected()}
      </View>
    );
  };

  /* View */

  return (
    <>
      {isShowTemplates && templateType === 'notes' ? renderNotesTemplateModal()
        : isShowTemplates && isShowNameInput ? renderTemplateNameInput()
          : isShowTemplates && isShowForm ? renderFormFields()
            : isShowTemplates ? renderTemplatesList()
              : renderTemplateToggle()}
    </>
  );
};

export default TemplatesNotebook;
