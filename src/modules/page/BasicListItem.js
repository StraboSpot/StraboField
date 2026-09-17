import React from 'react';

import {Icon, ListItem} from '@rn-vui/base';

import {getFeatureTitle} from './featureLabels.helpers';
import {PAGE_KEYS} from './pageKeys.constants';
import commonStyles from '../../shared/common.styles';
import {MEDIUMGREY} from '../../shared/styles.constants';
import useForm from '../form/useForm';
import useSed from '../sed/useSed';

const BasicListItem = ({
                         drag,
                         editItem,
                         index,
                         isReorderingActive,
                         item,
                         page,
                       }) => {
  /* Data Hooks */

  const {getLabel, getLabels} = useForm();
  const {getStratSectionTitle} = useSed();

  /* Logic Helpers */

  // getFeatureTitle gives what the item itself is called. The positions below belong to the list rather than to
  // the item, which is why they are added here and never stored - deleting a row would strand them otherwise.
  const getTitle = () => {
    const title = getFeatureTitle(page.key, item, getLabel, getLabels);
    switch (page.key) {
      case PAGE_KEYS.MINERALS:
      case PAGE_KEYS.REACTIONS:
      case PAGE_KEYS.ROCK_TYPE_ALTERATION_ORE:
      case PAGE_KEYS.ROCK_TYPE_IGNEOUS:
      case PAGE_KEYS.ROCK_TYPE_METAMORPHIC:
      case PAGE_KEYS.ROCK_TYPE_FAULT:
      case PAGE_KEYS.ROCK_TYPE_SEDIMENTARY:
      case PAGE_KEYS.EARTHQUAKES:
        return title;
      case PAGE_KEYS.LITHOLOGIES:
      case PAGE_KEYS.BEDDING:
        return 'Lithology ' + (index + 1) + ': ' + title;
      // A tephra label names the layer rather than titling it, so the layer type is shown after it either way
      case PAGE_KEYS.TEPHRA:
        return (item?.label || (index + 1)) + ' - '
          + getLabel(item?.layer_type, [PAGE_KEYS.TEPHRA, 'interval_basic']);
      case PAGE_KEYS.STRAT_SECTION:
        return getStratSectionTitle(item);
      case PAGE_KEYS.STRUCTURES:
      case PAGE_KEYS.DIAGENESIS:
      case PAGE_KEYS.FOSSILS:
      case PAGE_KEYS.INTERPRETATIONS:
        return title || 'Lithology ' + (index + 1);
      default:
        return 'Unknown';
    }
  };

  /* View */

  return (
    <ListItem
      containerStyle={commonStyles.listItem}
      delayLongPress={500}
      key={item.id}
      onLongPress={drag}
      onPress={() => !isReorderingActive && editItem(item, index)}
    >
      <ListItem.Content style={{overflow: 'hidden'}}>
        <ListItem.Title style={commonStyles.listItemTitle}>{getTitle()}</ListItem.Title>
      </ListItem.Content>
      {isReorderingActive ? (
        <Icon
          color={MEDIUMGREY}
          name={'chevron-expand'}
          size={20}
          type={'ionicon'}
        />
      ) : <ListItem.Chevron color={MEDIUMGREY}/>}
    </ListItem>
  );
};

export default BasicListItem;
