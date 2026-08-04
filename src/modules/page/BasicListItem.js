import React from 'react';

import {Icon, ListItem} from '@rn-vui/base';

import {PAGE_KEYS} from './pageKeys.constants';
import commonStyles from '../../shared/common.styles';
import {MEDIUMGREY} from '../../shared/styles.constants';
import {useForm} from '../form';
import usePetrology from '../petrology/usePetrology';
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

  const {getLabel} = useForm();
  const {getMineralTitle, getPetRockTitle, getReactionTextureTitle} = usePetrology();
  const {getBeddingTitle, getSedRockTitle, getStratSectionTitle} = useSed();

  /* Logic Helpers */

  const getTitle = () => {
    switch (page.key) {
      case PAGE_KEYS.MINERALS:
        return getMineralTitle(item);
      case PAGE_KEYS.REACTIONS:
        return getReactionTextureTitle(item);
      case PAGE_KEYS.ROCK_TYPE_ALTERATION_ORE:
      case PAGE_KEYS.ROCK_TYPE_IGNEOUS:
      case PAGE_KEYS.ROCK_TYPE_METAMORPHIC:
      case PAGE_KEYS.ROCK_TYPE_FAULT:
        return getPetRockTitle(item, page.key);
      case PAGE_KEYS.ROCK_TYPE_SEDIMENTARY:
        return getSedRockTitle(item);
      case PAGE_KEYS.LITHOLOGIES:
        return 'Lithology ' + (index + 1) + ': ' + getSedRockTitle(item);
      case PAGE_KEYS.STRAT_SECTION:
        return getStratSectionTitle(item);
      case PAGE_KEYS.BEDDING:
        return 'Lithology ' + (index + 1) + ': ' + getBeddingTitle(item);
      case PAGE_KEYS.STRUCTURES:
      case PAGE_KEYS.DIAGENESIS:
      case PAGE_KEYS.FOSSILS:
      case PAGE_KEYS.INTERPRETATIONS:
        return 'Lithology ' + (index + 1);
      case PAGE_KEYS.TEPHRA:
        return (item?.label || (index + 1)) + ' - '
          + getLabel(item?.layer_type, [PAGE_KEYS.TEPHRA, 'interval_basic']);
      case PAGE_KEYS.EARTHQUAKES:
        return getLabel(item?.earthquake_feature, ['general', PAGE_KEYS.EARTHQUAKES]);
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
