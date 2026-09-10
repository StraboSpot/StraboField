import React from 'react';
import {View} from 'react-native';

import {STRABO_APIS} from '../../../services/network/urls.constants';
import {BLUE} from '../../../shared/styles.constants';
import UrlLinkButton from '../../../shared/ui/buttons/UrlLinkButton';
import SectionDivider from '../../../shared/ui/SectionDivider';

const links = [
  {
    id: 1,
    title: 'Online Help Page',
    url: STRABO_APIS.STRABO + '/help',
    icon: 'globe-outline',
    color: BLUE,
  },
  {
    id: 2,
    title: 'YouTube Tutorials',
    url: 'https://youtube.com/playlist?list=PL3jEmSMv6rzHysg-mEVx_yhaXStgK8MV5&si=sv_i9YayDdv_LfYf',
    icon: 'logo-youtube',
    color: 'red',
  },
];

const OnlineResourcesSection = () => {
  const renderLinkButton = item => (
    <UrlLinkButton
      color={item.color}
      icon={item.icon}
      key={item.id}
      title={item.title}
      url={item.url}
    />
  );

  return (
    <>
      <SectionDivider dividerText={'Online Resources'}/>
      <View>
        {links.map(renderLinkButton)}
      </View>
    </>
  );
};

export default OnlineResourcesSection;
