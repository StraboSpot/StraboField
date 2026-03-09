import React from 'react';

import useTemplates from './useTemplates';
import SectionDivider from '../../shared/ui/SectionDivider';

const TemplateSectionHeader = ({section}) => {
  /* Data Hooks */

  const {getTemplateTitle} = useTemplates();

  /* Derived Variables */

  const title = getTemplateTitle(section.title);

  /* View */

  return <SectionDivider dividerText={title}/>;
};

export default TemplateSectionHeader;
