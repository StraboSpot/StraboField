export const SAMPLE_FORM_NAME = ['general', 'samples'];

// Relevant keys for sample quick-entry modal
export const SAMPLE_TYPE_KEY = ['sample_type', 'material_type'];
export const SAMPLE_FIRST_KEYS = ['sample_id_name', 'label', 'sample_description'];
export const SAMPLE_INPLACENESS_KEY = 'inplaceness_of_sample';
export const SAMPLE_ORIENTED_KEY = 'oriented_sample';

// StraboSamples field -> Field sample key, for filling in a sample linked to StraboSamples
export const STRABOSAMPLES_FIELD_MAP = {
  name: 'sample_id_name',
  igsn: 'Sample_IGSN',
  description: 'sample_description',
  notes: 'sample_notes',
  display_sample_type: 'material_type',
  display_sample_purpose: 'main_sampling_purpose',
};
