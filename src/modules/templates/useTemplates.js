import {useDispatch, useSelector} from 'react-redux';

import {getNewUUID, isEmpty, toTitleCase} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import {addedTemplates, setActiveTemplates} from '../project/projects.slice';

const useTemplates = () => {
  const dispatch = useDispatch();
  const templates = useSelector(state => state.project.project?.templates);

  const getTemplateTitle = (key) => {
    if (key === 'alteration_or') return 'Alteration, Ore Rock';
    else if (key === 'fault') return 'Fault & Shear Zone Rock';
    else if (key === 'plutonic' || key === 'volcanic') return toTitleCase(key.replace('_', ' ')) + ' Rock';
    else if (key === 'tabular_orientation') return 'Tabular Zone Orientation';
    else return toTitleCase(key.replaceAll('_', ' '));
  };

  const saveTemplate = (values, templateKey, selectedTemplate, name) => {
    let templateObject;
    if (isEmpty(name)) alert('Template name empty', 'Provide a template name.');
    else {
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
    }
  };

  return {
    getTemplateTitle,
    saveTemplate,
  };
};

export default useTemplates;
