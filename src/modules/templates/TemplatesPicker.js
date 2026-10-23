import React, {useEffect, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import NoteTemplateForm from './NoteTemplateForm';
import {MEASUREMENT_TEMPLATE_KEY} from './templates.constants';
import {
  getActiveTemplateList,
  getIsTemplateInUse,
  getLinearTemplates,
  getPlanarTemplates,
  getTemplateList,
} from './templates.helpers';
import useTemplates from './useTemplates';
import commonStyles from '../../shared/common.styles';
import {isEmpty, toTitleCase} from '../../shared/helpers';
import * as themes from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import buttonsStyles from '../../shared/ui/buttons/buttons.styles';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import UnsavedChangesModal from '../../shared/ui/modals/UnsavedChangesModal';
import SwitchWrapper from '../../shared/ui/SwitchWrapper';
import TextInput from '../../shared/ui/TextInput';
import formStyles from '../form/form.styles';
import MeasurementDetail from '../measurements/MeasurementDetail';
import {MEASUREMENT_KEYS} from '../measurements/measurements.constants';
import {isPlanarType} from '../measurements/measurements.helpers';
import {LeavePageContext} from '../notebook-panel/LeavePageContext';
import useLeavePage from '../notebook-panel/useLeavePage';
import FeatureDetail from '../page/FeatureDetail';
import {MODALS, PET_PAGES, SED_PAGES} from '../page/page.constants';
import {MODAL_KEYS} from '../page/pageKeys.constants';
import {addedTemplates, setActiveTemplates, setUseTemplate} from '../project/projects.slice';

// The template being edited asks about its unsaved changes through a gate of its own, not the notebook page's:
// closing it leaves the page or modal it was opened from still open. registerCloseTemplates hands the parent a close
// that asks first, for the parent's own close button.
const TemplatesPicker = ({
                           isShowTemplates,
                           page = {},
                           registerCloseTemplates,
                           rockKey,
                           setIsShowTemplates,
                           typeKey,
                         }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const activeModal = useSelector(state => state.home.activeModal);
  const templates = useSelector(state => state.project.project?.templates);

  const templateGate = useLeavePage({isForSpot: false});
  const {saveTemplateValues} = useTemplates();

  /* Local State */

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
  if (isEmpty(page) && activeModal) {
    page = MODALS.find(p => p.key === activeModal);
    templateKey = activeModal === MODAL_KEYS.NOTEBOOK.MEASUREMENTS
    || activeModal === MODAL_KEYS.SHORTCUTS.MEASUREMENT ? MEASUREMENT_TEMPLATE_KEY
      : activeModal === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_IGNEOUS
      || activeModal === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_SEDIMENTARY ? rockKey
        : page.notebook_modal_key ? page.notebook_modal_key
          : activeModal;
  }
  // The name is typed before the form opens, so the form can't tell it changed. A new template counts once named.
  const isTemplateNameChanged = name !== (selectedTemplate.name || '');

  /* Side Effects */

  useEffect(() => {
    console.log('UE TemplatesPicker [templates, templateKey, typeKey]', templates, templateKey, typeKey);
    setIsTemplateInUse(getIsTemplateInUse(templates, templateKey) || false);
    setTemplatesForKey(getTemplateList(templates, templateKey) || []);
    setActiveTemplatesForKey(getActiveTemplateList(templates, templateKey) || []);
  }, [templates, templateKey, typeKey]);

  /* Logic Helpers */

  const askAndCloseTemplates = async () => {
    if (templateGate.hasUnsavedPageChanges() && !await templateGate.confirmLeavePage()) return;
    closeTemplates();
  };

  const clearTemplate = () => {
    if (templateType === MEASUREMENT_KEYS.PLANAR) {
      const activeLinearTemplates = getLinearTemplates(activeTemplatesForKey);
      dispatch(setActiveTemplates({key: templateKey, templates: activeLinearTemplates}));
    }
    else if (templateType === MEASUREMENT_KEYS.LINEAR) {
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
    else if (activeModal === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_IGNEOUS) {
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
    if (isEmpty(name)) alert('Template name empty', 'Provide a template name.');
    else {
      saveTemplateValues(templateKey, selectedTemplate, name, values);
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

  if (registerCloseTemplates) registerCloseTemplates.current = askAndCloseTemplates;

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
        isTemplateNameChanged={isTemplateNameChanged}
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
      <FeatureDetail
        closeDetailView={() => setIsShowForm(false)}
        deleteTemplate={deleteTemplateConfirm}
        groupKey={groupKey}
        isTemplateNameChanged={isTemplateNameChanged}
        page={page}
        saveTemplate={saveTemplate}
        selectedFeature={selectedTemplate.values}
      />
    );
  };

  const renderNotesForm = () => {
    return (
      <NoteTemplateForm
        closeForm={() => setIsShowForm(false)}
        initialNotesValues={selectedTemplate.values}
        isTemplateNameChanged={isTemplateNameChanged}
        saveTemplate={saveTemplate}
      />
    );
  };

  const renderNotesTemplateModal = () => {
    return (
      <ModalWrapper
        closeModal={askAndCloseTemplates}
        headerTitle={isShowForm || isShowNameInput ? 'Edit Notes Template' : 'Notes Templates'}
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
          containerStyle={commonStyles.listItem}
          onPress={() => setAsTemplate(template)}
        >
          <ListItem.CheckBox
            checked={isActive}
            onPress={() => setAsTemplate(template)}
          />
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>
              {template.name}
            </ListItem.Title>
          </ListItem.Content>
          <ClearButton
            onPress={() => editTemplate(template)}
            title={'Edit'}
            titleProps={{style: buttonsStyles.standardButtonText}}
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
    if (isPlanarType(type)) {
      activeTemplates = getPlanarTemplates(activeTemplatesForKey);
      label = 'Planar';
    }
    else if (type === MEASUREMENT_KEYS.LINEAR) {
      activeTemplates = getLinearTemplates(activeTemplatesForKey);
      label = 'Linear';
    }
    else if (activeModal === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_IGNEOUS) label = toTitleCase(type);

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
    let label = activeModal === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_IGNEOUS ? toTitleCase(templateKey) + ' Rock'
      : page.label_singular || toTitleCase(page.label).slice(0, -1) || 'Unknown';

    let relevantTemplates = templatesForKey;
    if (templateType === MEASUREMENT_KEYS.PLANAR) {
      relevantTemplates = getPlanarTemplates(relevantTemplates);
      label = 'Planar';
    }
    else if (templateType === MEASUREMENT_KEYS.LINEAR) {
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
            {renderTemplateSelection(MEASUREMENT_KEYS.PLANAR)}
            {renderTemplateSelection(MEASUREMENT_KEYS.LINEAR)}
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
    <LeavePageContext.Provider value={templateGate}>
      {isShowTemplates && templateType === 'notes' ? renderNotesTemplateModal()
        : isShowTemplates && isShowNameInput ? renderTemplateNameInput()
          : isShowTemplates && isShowForm ? renderFormFields()
            : isShowTemplates ? renderTemplatesList()
              : renderTemplateToggle()}
      <UnsavedChangesModal {...templateGate.leavePromptProps} headerTitle={'Unsaved Changes'}/>
    </LeavePageContext.Provider>
  );
};

export default TemplatesPicker;
