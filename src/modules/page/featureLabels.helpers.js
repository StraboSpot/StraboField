import {PAGE_KEYS} from './pageKeys.constants';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {getFabricTitle} from '../fabrics/fabrics.helpers';
import {getMeasurementTypeText} from '../measurements/measurements.helpers';
import {getTitle as getOtherFeatureTitle} from '../other-features/otherFeatures.helpers';
import {getMineralTitle} from '../petrology/minerals/minerals.helpers';
import {getReactionTextureTitle} from '../petrology/reaction-textures/reactionTextures.helpers';
import {getPetRockTitle} from '../petrology/rocks/rocks.helpers';
import {getBeddingTitle, getSedRockTitle} from '../sed/sed.helpers';
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
    case PAGE_KEYS.EARTHQUAKES:
      return getLabel(feature.earthquake_feature, ['general', PAGE_KEYS.EARTHQUAKES]);
    case PAGE_KEYS.FABRICS:
      return getFabricTitle(feature, getLabel, getLabels);
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

// alert is callback-based on native and a window.confirm polyfill on web, so give it back as something a save
// can wait on. Keeping is the cancel option, so dismissing the prompt leaves the label alone.
const confirmLabelUpdate = (storedLabel, newLabel) => new Promise(resolve => alert(
  'Update Label?',
  'This feature\'s label was filled in for it, and its data has since changed.'
  + '\n\nKeep "' + storedLabel + '" or update it to "' + newLabel + '"?',
  [
    {text: 'Keep', style: 'cancel', onPress: () => resolve(false)},
    {text: 'Update', onPress: () => resolve(true)},
  ],
  {cancelable: false},
));

// The label to save with a feature, asking first where the answer is the user's to give. Returns the values
// unchanged when there is nothing to label them with, so a page can hand its values straight through.
// previousFeature is the feature as the form opened it, and is left out when one is being created.
export const resolveLabelOnSave = async ({pageKey, previousFeature, values, getLabel, getLabels}) => {
  const newLabel = getDefaultLabel(pageKey, values, getLabel, getLabels);
  if (isEmpty(newLabel)) return values;

  // An unlabeled feature is labeled for it, which is also how clearing the field asks for the default back
  if (isEmpty(values.label)) return {...values, label: newLabel};
  // Typed into this save, so it is the user's own and stands however it compares to the default
  if (values.label !== previousFeature?.label) return values;
  if (newLabel === values.label) return values;

  // Whether the stored label was filled in for the user is recomputed rather than remembered: if it still
  // matches what the feature read as when the form opened, nothing has been typed over it. A label that does
  // not match was written by hand, and is left alone.
  const previousLabel = getDefaultLabel(pageKey, previousFeature, getLabel, getLabels);
  if (previousFeature.label !== previousLabel) return values;
  return (await confirmLabelUpdate(values.label, newLabel)) ? {...values, label: newLabel} : values;
};
