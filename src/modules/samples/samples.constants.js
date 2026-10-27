export const SAMPLE_FORM_NAME = ['general', 'samples'];

// Relevant keys for sample quick-entry modal
export const SAMPLE_TYPE_KEY = ['sample_type', 'material_type'];
export const SAMPLE_FIRST_KEYS = ['sample_id_name', 'label', 'sample_description'];
// IGSNs are minted on strabospot.org and arrive with the sample, so the app only ever shows one
export const SAMPLE_IGSN_KEY = 'Sample_IGSN';
// Where an uploaded sample is sent on to SESAR, which strabospot.org does not do by itself
export const SAMPLES_PAGE_URL = 'https://strabospot.org/my_samples.php';
// One sample's page is SAMPLE_PAGE_BASE_URL/{straboUserId}/{sample id}
export const SAMPLE_PAGE_BASE_URL = 'https://strabospot.org/samples';
export const SAMPLE_INPLACENESS_KEY = 'inplaceness_of_sample';
export const SAMPLE_ORIENTED_KEY = 'oriented_sample';
