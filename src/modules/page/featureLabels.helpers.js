import {PAGE_KEYS} from './pageKeys.constants';
import {isEmpty} from '../../shared/helpers';
import {getFabricTitle} from '../fabrics/fabrics.helpers';
import {getMeasurementTypeText} from '../measurements/measurements.helpers';
import {getTitle as getOtherFeatureTitle} from '../other-features/otherFeatures.helpers';
import {getMineralTitle} from '../petrology/minerals/minerals.helpers';
import {getReactionTextureTitle} from '../petrology/reaction-textures/reactionTextures.helpers';
import {getPetRockTitle} from '../petrology/rocks/rocks.helpers';
import {getBeddingTitle, getDiagenesisTitle, getFossilTitle, getSedRockTitle, getStructureTitle} from '../sed/sed.helpers';
import {getThreeDStructureTitle} from '../three-d-structures/threeDStructures.helpers';

// The label a feature is given when the user does not type one: the title its list would otherwise build from
// the feature's own fields, and only that part. What a list adds at render time is left out - the 'Lithology N'
// prefixes, which are positions and go stale as soon as a sibling is deleted, and a measurement's orientation
// numbers, which follow the user's measurement convention setting.
// Undefined where there is nothing to derive: pages whose rows are titled by position alone, and tephra, whose
// label is a short identifier the layer type is shown after rather than a title, filled in by TephraPage.
// getLabel and getLabels are passed in because a plain helper cannot call useForm.
export const getDefaultLabel = (pageKey, feature, getLabel, getLabels) => {
  if (isEmpty(feature)) return undefined;
  switch (pageKey) {
    case PAGE_KEYS.BEDDING:
      return getBeddingTitle(feature, getLabels);
    case PAGE_KEYS.DIAGENESIS:
      return getDiagenesisTitle(feature);
    case PAGE_KEYS.EARTHQUAKES:
      return getLabel(feature.earthquake_feature, ['general', PAGE_KEYS.EARTHQUAKES]);
    case PAGE_KEYS.FABRICS:
      return getFabricTitle(feature, getLabel, getLabels);
    case PAGE_KEYS.FOSSILS:
      return getFossilTitle(feature, getLabels);
    case PAGE_KEYS.LITHOLOGIES:
    case PAGE_KEYS.ROCK_TYPE_SEDIMENTARY:
      return getSedRockTitle(feature, getLabel, getLabels);
    case PAGE_KEYS.MEASUREMENTS:
      return getMeasurementTypeText(feature, getLabel);
    case PAGE_KEYS.MINERALS:
      return getMineralTitle(feature);
    case PAGE_KEYS.OTHER_FEATURES:
      return getOtherFeatureTitle(feature);
    case PAGE_KEYS.REACTIONS:
      return getReactionTextureTitle(feature, getLabels);
    case PAGE_KEYS.ROCK_TYPE_ALTERATION_ORE:
    case PAGE_KEYS.ROCK_TYPE_FAULT:
    case PAGE_KEYS.ROCK_TYPE_IGNEOUS:
    case PAGE_KEYS.ROCK_TYPE_METAMORPHIC:
      return getPetRockTitle(feature, pageKey, getLabel, getLabels);
    // A sample is already named by the user, so that name is what its label is filled in with
    case PAGE_KEYS.SAMPLES:
      return feature.sample_id_name;
    case PAGE_KEYS.STRUCTURES:
      return getStructureTitle(feature);
    case PAGE_KEYS.THREE_D_STRUCTURES:
      return getThreeDStructureTitle(feature, getLabel);
    default:
      return undefined;
  }
};

// What a list calls a feature: the label if it has one, and otherwise the default that label would be filled in
// with. A list that prefixes a position adds that to this itself, and sorting by it keeps a list in the order it
// reads in.
export const getFeatureTitle = (pageKey, feature, getLabel, getLabels) => feature?.label
  || getDefaultLabel(pageKey, feature, getLabel, getLabels);

// The label to save with a feature. One the user typed stands; one filled in for them follows the data, and is
// cleared where the data it was filled in from is gone. Returns the values unchanged when the label stays as it
// is, so a page can hand its values straight through.
// previousFeature is the feature as the form opened it, and is left out when one is being created.
export const resolveLabelOnSave = ({pageKey, previousFeature, values, getLabel, getLabels}) => {
  const newLabel = getDefaultLabel(pageKey, values, getLabel, getLabels);
  if (newLabel === values.label) return values;

  // Whether a label was typed is recomputed rather than remembered: typed into this save, or no longer what the
  // feature read as when the form opened. An empty field is never typed, which is how clearing it asks for the
  // default back.
  const isTyped = !isEmpty(values.label) && (values.label !== previousFeature?.label
    || values.label !== getDefaultLabel(pageKey, previousFeature, getLabel, getLabels));
  return isTyped ? values : {...values, label: newLabel};
};
