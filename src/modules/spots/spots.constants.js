export const PICKER_KEYS = {SPOTS: 'spots', IMAGES: 'images', SAMPLES: 'samples', REPORTS: 'reports'};

export const PICKER_LABELS = {
  [PICKER_KEYS.SPOTS]: 'SPOTS LISTS',
  [PICKER_KEYS.SAMPLES]: 'SAMPLES',
  [PICKER_KEYS.IMAGES]: 'IMAGE GALLERY',
  [PICKER_KEYS.REPORTS]: 'REPORTS',
};

export const SORT_ORDER = {
  ALPHABETICAL: 'Alphabetical',
  DATE_CREATED: 'Date Created',
  DATE_LAST_MODIFIED: 'Date Last Modified',
  RECENTLY_VIEWED: 'Recently Viewed',
};

export const FILTERS = {
  DESCRIPTION: 'DESCRIPTION',
  IS_ON_MY_SESAR: 'IS_ON_MY_SESAR',
  MAPPED_ON_IMAGE_BASEMAP: 'MAPPED_ON_IMAGE_BASEMAP',
  MAPPED_ON_STRAT_SECTION: 'MAPPED_ON_STRAT_SECTION',
  MAP_EXTENT: 'MAP_EXTENT',
  MEASUREMENTS: 'MEASUREMENTS',
  NOTES: 'NOTES',
  PHOTO: 'PHOTO',
  QAQC: 'QAQC',
  RECENT_VIEWS: 'RECENT_VIEWS',
  SAMPLE_IGSN: 'SAMPLE_IGSN',
  SKETCH: 'SKETCH',
  STRAT_SECTIONS: 'STRAT_SECTIONS',
};

export const FILTER_LABELS = {
  [FILTERS.DESCRIPTION]: 'Descriptions',
  [FILTERS.IS_ON_MY_SESAR]: 'On MySESAR',
  [FILTERS.MAPPED_ON_IMAGE_BASEMAP]: 'On Image Basemaps',
  [FILTERS.MAPPED_ON_STRAT_SECTION]: 'On Strat Sections',
  [FILTERS.MAP_EXTENT]: 'In Current Map Extent',
  [FILTERS.MEASUREMENTS]: 'Measurements',
  [FILTERS.NOTES]: 'Notes',
  [FILTERS.PHOTO]: 'Photos',
  [FILTERS.QAQC]: 'QA/QC',
  [FILTERS.RECENT_VIEWS]: 'In Recent Views',
  [FILTERS.SAMPLE_IGSN]: 'IGSN',
  [FILTERS.SKETCH]: 'Sketches',
  [FILTERS.STRAT_SECTIONS]: 'Strat Sections',
};

// Singular scope phrases for child-level (image/sample) data filters, used when a single result matches,
// e.g. "1 image with a Description". Filters without an entry keep their plural FILTER_LABELS wording.
export const FILTER_LABELS_SINGULAR = {
  [FILTERS.DESCRIPTION]: 'a Description',
  [FILTERS.PHOTO]: 'a Photo',
  [FILTERS.SAMPLE_IGSN]: 'an IGSN',
  [FILTERS.SKETCH]: 'a Sketch',
};

// Spot Data filters (in display order); they read with "with" in the list header, e.g. "3 Spots with Measurements".
export const SPOT_DATA_FILTERS = [FILTERS.MEASUREMENTS, FILTERS.NOTES, FILTERS.QAQC, FILTERS.STRAT_SECTIONS];

// Image Data filters (Images page only); like Spot Data they read with "with", e.g. "3 images with Description".
export const IMAGE_DATA_FILTERS = [FILTERS.DESCRIPTION, FILTERS.PHOTO, FILTERS.SKETCH];

// Image type filters read as "that are Photos" / "that is a Photo" (the image *is* the type) rather than "with".
export const IMAGE_TYPE_FILTERS = [FILTERS.PHOTO, FILTERS.SKETCH];

// Sample Data filters (Samples page only), in display order.
export const SAMPLE_DATA_FILTERS = [FILTERS.SAMPLE_IGSN, FILTERS.IS_ON_MY_SESAR];
