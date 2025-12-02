import React from 'react';

import useTemplates from './useTemplates';
import SectionDivider from '../../shared/ui/SectionDivider';

const TemplateSectionHeader = ({section}) => {
  const {getTemplateTitle} = useTemplates();

  const title = getTemplateTitle(section.title);
  return <SectionDivider dividerText={title}/>;
};

export default TemplateSectionHeader;
