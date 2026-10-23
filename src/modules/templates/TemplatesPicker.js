import React, {useEffect, useState} from 'react';
import {FlatList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import NoteTemplateForm from './NoteTemplateForm';
import {MEASUREMENT_TEMPLATE_KEY} from './templates.constants';
import {
  getActiveTemplateList,
  getIsTemplateInUse,
  getLinearTemplates,
  getPlanarTemplates,
  getTemplateFormValues,
  getTemplateList,
} from './templates.helpers';
import useTemplates from './useTemplates';
import commonStyles from '../../shared/common.styles';
import {isEmpty, toTitleCase} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import buttonsStyles from '../../shared/ui/buttons/buttons.styles';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import UnsavedChangesModal from '../../shared/ui/modals/UnsavedChangesModal';
import SwitchWrapper from '../../shared/ui/SwitchWrapper';
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
// closing it leaves the page or modal it was opened from still open. A parent modal the templates fill passes
// registerCloseTemplates, for a close of its own that asks first, and setTemplatesHeaderTitle, to head the modal
// with what the templates are while they show.
const TemplatesPicker = ({
                           isShowTemplates,
                           page = {},
                           registerCloseTemplates,
                           rockKey,
                           setIsShowTemplates,
                           setTemplatesHeaderTitle,
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
  const [isTemplateInUse, setIsTemplateInUse] = useState(false);
  // The template open in the form, its values already holding its name for the form to edit
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
  // What the templates being picked from are called: a measurement's by its orientation, the rest by their page
  const templateKindLabel = templateType === MEASUREMENT_KEYS.PLANAR ? 'Planar'
    : templateType === MEASUREMENT_KEYS.LINEAR ? 'Linear'
      : activeModal === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_IGNEOUS ? toTitleCase(templateKey) + ' Rock'
        : page.label_singular || toTitleCase(page.label).slice(0, -1) || 'Unknown';

  /* Side Effects */

  useEffect(() => {
    console.log('UE TemplatesPicker [templates, templateKey, typeKey]', templates, templateKey, typeKey);
    setIsTemplateInUse(getIsTemplateInUse(templates, templateKey) || false);
    setTemplatesForKey(getTemplateList(templates, templateKey) || []);
    setActiveTemplatesForKey(getActiveTemplateList(templates, templateKey) || []);
  }, [templates, templateKey, typeKey]);

  useEffect(() => {
    setTemplatesHeaderTitle?.(isShowForm ? `Edit ${templateKindLabel} Template` : `${templateKindLabel} Templates`);
  }, [isShowForm, templateKindLabel]);

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

  const createNewTemplate = () => {
    if (templateKey === MEASUREMENT_TEMPLATE_KEY) openTemplateForm({values: {type: templateType}});
    else if (activeModal === MODAL_KEYS.NOTEBOOK.ROCK_TYPE_IGNEOUS) {
      openTemplateForm({values: {igneous_rock_class: templateType}});
    }
    else openTemplateForm({values: {}});
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

  // Set once as the form opens, so the form is handed the same values on every render
  const openTemplateForm = (template) => {
    setSelectedTemplate({...template, values: getTemplateFormValues(template)});
    setIsShowForm(true);
  };

  // The form holds Save until the template is named
  const saveTemplate = (values) => {
    saveTemplateValues(templateKey, selectedTemplate, values);
    closeTemplates();
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
        initialValues={selectedTemplate.values}
        saveTemplate={saveTemplate}
      />
    );
  };

  const renderNotesTemplateModal = () => {
    return (
      <ModalWrapper
        closeModal={askAndCloseTemplates}
        headerTitle={isShowForm ? 'Edit Notes Template' : 'Notes Templates'}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        {isShowForm ? renderNotesForm() : renderTemplatesList()}
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
            onPress={() => openTemplateForm(template)}
            title={'Edit'}
            titleProps={{style: buttonsStyles.standardButtonText}}
            type={'save'}
          />
        </ListItem>
      </View>
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
    const relevantTemplates = templateType === MEASUREMENT_KEYS.PLANAR ? getPlanarTemplates(templatesForKey)
      : templateType === MEASUREMENT_KEYS.LINEAR ? getLinearTemplates(templatesForKey)
        : templatesForKey;

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
        <ClearButton onPress={createNewTemplate} title={'Define New ' + templateKindLabel + ' Template'}/>
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
        : isShowTemplates && isShowForm ? renderFormFields()
          : isShowTemplates ? renderTemplatesList()
            : renderTemplateToggle()}
      <UnsavedChangesModal {...templateGate.leavePromptProps} headerTitle={'Unsaved Changes'}/>
    </LeavePageContext.Provider>
  );
};

export default TemplatesPicker;
