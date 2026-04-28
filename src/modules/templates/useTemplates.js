import {useDispatch, useSelector} from 'react-redux';

import forms from '../../assets/forms';
import {getNewUUID, isEmpty, toTitleCase} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {useForm} from '../form';
import {addedTemplates, setActiveTemplates, setUseTemplate} from '../project/projects.slice';

const useTemplates = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const templates = useSelector(state => state.project.project?.templates);

  const {showErrors} = useForm();

  /* Exported Functions */

  const getNewTemplatesList = () => {
    // console.log('forms', forms);
    let templateForms = Object.entries(forms).reduce((acc, [categoryKey, formsInCategory]) => {
      if (categoryKey === 'measurement' || categoryKey === 'pet') {
        const addTemplateForms = Object.keys(formsInCategory).reduce((acc2, key) => {
          if (key !== 'reactions') return [...acc2, key];
          else return acc2;
        }, []);
        return [...acc, {title: categoryKey, data: addTemplateForms}];
      }
      else return acc;
    }, []);
    templateForms = [...templateForms, {title: 'notes', data: ['notes']}];
    return templateForms;
  };

  const getTemplateTitle = (key) => {
    if (key === 'alteration_or') return 'Alteration, Ore Rock';
    else if (key === 'fault') return 'Fault & Shear Zone Rock';
    else if (key === 'plutonic' || key === 'volcanic' || key === 'metamorphic') {
      return toTitleCase(key.replace('_', ' ')) + ' Rock';
    }
    else if (key === 'minerals') return 'Mineral';
    else if (key === 'tabular_orientation') return 'Tabular Zone Orientation';
    else if (key === 'pet') return 'Rocks & Minerals';
    else if (key) return toTitleCase(key.replaceAll('_', ' ').trim());
  };

  const saveTemplate = async (formCurrent, templateKey, selectedTemplate, name) => {
    let templateObject;
    if (isEmpty(name)) {
      alert('Template name empty', 'Provide a template name.');
      throw Error;
    }
    else {
      await formCurrent.submitForm();
      const values = showErrors(formCurrent);
      const templatesForKey = templateKey === 'measurementTemplates' ? templates[templateKey]
        : templates[templateKey]?.templates;
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
      const activeTemplatesForKey = templateKey === 'measurementTemplates'
        ? templates.activeMeasurementTemplates || []
        : templates[templateKey]?.active || [];
      const templatesUpdated = activeTemplatesForKey?.filter(t => t.id !== templateObject.id) || [];
      dispatch(setActiveTemplates({key: templateKey, templates: [...templatesUpdated, templateObject]}));
      dispatch(setUseTemplate({key: templateKey, bool: true}));
    }
  };

  return {
    getNewTemplatesList,
    getTemplateTitle,
    saveTemplate,
  };
};

export default useTemplates;
