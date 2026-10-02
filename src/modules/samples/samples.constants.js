export const SAMPLE_FORM_NAME = ['general', 'samples'];

// Relevant keys for sample quick-entry modal
export const SAMPLE_TYPE_KEY = ['sample_type', 'material_type'];
export const SAMPLE_FIRST_KEYS = ['sample_id_name', 'label', 'sample_description'];
export const SAMPLE_INPLACENESS_KEY = 'inplaceness_of_sample';
export const SAMPLE_ORIENTED_KEY = 'oriented_sample';

// StraboSamples field -> Field sample key(s), for filling in a sample linked to StraboSamples. The name goes to both
// the sample's name and its label, which is what the sample is called in a list. Latitude and longitude aren't here:
// a Field sample's location is its Spot's geometry, so they are compared on their own as SAMPLE_LOCATION_KEY.
// What StraboMicro and StraboExperimental hold for a linked sample, kept on the Sample Spot under the same keys the
// sample detail gives them
export const STRABOSAMPLES_LINKED_DATA_KEYS = ['micro_data', 'experimental_data'];

// The tabs of a linked sample's detail: the Field sample itself, then each app's data kept on its Sample Spot.
export const SAMPLE_DETAIL_TABS = [
  {key: 'field'},
  {key: 'micro', dataKey: 'micro_data'},
  {key: 'experimental', dataKey: 'experimental_data'},
];

// The key a difference in location is reviewed under, alongside the sample's own fields
export const SAMPLE_LOCATION_KEY = 'location';
// Coordinates are compared to no more decimal places than StraboSamples gives them, and never more than this many
export const SAMPLE_LOCATION_MAX_DECIMALS = 5;

// StraboSamples needs the sample owner's user id, which a profile saved before the server sent it doesn't have
export const MISSING_STRABO_USER_ID_MESSAGE = 'Your user profile is missing your StraboSpot user id. Go to Profile,'
  + ' tap Download User Profile, then try again.';

export const STRABOSAMPLES_FIELD_MAP = {
  name: ['sample_id_name', 'label'],
  igsn: 'Sample_IGSN',
  description: 'sample_description',
  notes: 'sample_notes',
  display_sample_type: 'material_type',
  display_sample_purpose: 'main_sampling_purpose',
};
