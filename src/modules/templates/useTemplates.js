import {useDispatch, useSelector} from 'react-redux';

import {TEMPLATE_NAME_FIELD} from './templates.constants';
import {getActiveTemplateList, getTemplateList, getTemplateValues} from './templates.helpers';
import {getNewUUID, isEmpty} from '../../shared/helpers';
import useForm from '../form/useForm';
import {addedTemplates, setActiveTemplates, setUseTemplate} from '../project/projects.slice';

const useTemplates = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const templates = useSelector(state => state.project.project?.templates);

  const {submitAndShowErrors} = useForm();

  /* Exported Functions */

  // Saves the form on screen as a template. The half TemplatesPicker also needs is in saveTemplateValues.
  const saveTemplate = async (formCurrent, templateKey, selectedTemplate) => {
    const {values: formValues} = await submitAndShowErrors(formCurrent);
    // The form holds Save until the name is filled in, so this is a backstop. It throws rather than returns
    // because the caller leaves the page on a save that comes back.
    if (isEmpty(formValues[TEMPLATE_NAME_FIELD]?.trim())) throw Error('Template name is empty.');
    saveTemplateValues(templateKey, selectedTemplate, formValues);
    // Saving from a detail page turns templates on for that key. TemplatesPicker deliberately does not -
    // it shows the user a switch for this instead.
    dispatch(setUseTemplate({key: templateKey, bool: true}));
  };

  // Writes a template into the project and makes it the active one for its key, whether it is new or an edit
  // of an existing one, from the template form's values with its name among them. Both save paths go through here
  // so they cannot drift apart.
  const saveTemplateValues = (templateKey, selectedTemplate, formValues) => {
    const templateObject = {
      'id': isEmpty(selectedTemplate?.id) ? getNewUUID() : selectedTemplate.id,
      'name': formValues[TEMPLATE_NAME_FIELD].trim(),
      'values': getTemplateValues(templateKey, formValues),
    };
    const templatesForKey = getTemplateList(templates, templateKey);
    const existingTemplates = !isEmpty(templatesForKey) ? JSON.parse(JSON.stringify(templatesForKey)) : [];
    // Filtering covers both cases: an edit drops the copy being replaced, a new id matches nothing
    const updatedTemplates = [...existingTemplates.filter(t => t.id !== templateObject.id), templateObject]
      .sort((templateA, templateB) => templateA.name.localeCompare(templateB.name));
    dispatch(addedTemplates({key: templateKey, templates: updatedTemplates}));

    // Update active templates so updated template becomes active
    const activeTemplatesForKey = getActiveTemplateList(templates, templateKey) || [];
    const activeUpdated = activeTemplatesForKey.filter(t => t.id !== templateObject.id);
    dispatch(setActiveTemplates({key: templateKey, templates: [...activeUpdated, templateObject]}));
  };

  return {
    saveTemplate,
    saveTemplateValues,
  };
};

export default useTemplates;
