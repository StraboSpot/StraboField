# StraboSpot2 Complete Data Schema Documentation

**Version:** 2.23.2
**Generated:** 2025-10-24
**Purpose:** Complete reference for all possible fields in Project, Dataset, and Spot objects

---

## Table of Contents
1. [Project Schema](#project-schema)
2. [Dataset Schema](#dataset-schema)
3. [Spot Schema](#spot-schema)
4. [Constants & Enumerations](#constants--enumerations)
5. [File References](#file-references)

---

## Project Schema

### Project Object Structure

```typescript
{
  // Core Identifiers
  id: string,                              // Unique project identifier (UUID)
  date: string,                            // ISO datetime when project created
  modified_timestamp: number,              // Unix timestamp of last modification

  // Project Description (Metadata)
  description: {
    project_name: string,                  // Required - Project name
    start_date: string,                    // ISO date
    end_date: string,                      // ISO date (must be >= start_date)
    notes: string,                         // Multiline text
    instruments: string,                   // GPS/measurement instruments used
    gps_datum: string,                     // Default: 'WGS84 (Default)'
    magnetic_declination: number,          // Default: 0, Range: -180 to 180
    orcid: string,                         // Researcher ORCID identifier
    other_team_members: string,            // Team member names
    area_of_interest: string,              // Geographic area description
    purpose_of_study: string,              // Study purpose/objectives
    grant_id: string,                      // Grant identifier
    funding_agency: string,                // Funding organization
  },

  // Feature Types
  other_features: string[],                // Array of geologic feature types
                                          // Defaults: ['geomorphic', 'hydrologic',
                                          //            'paleontological', 'igneous',
                                          //            'metamorphic', 'sedimentological',
                                          //            'other']

  // Relationship Types
  relationship_types: string[],            // Array of relationship type definitions
                                          // Defaults: ['cross-cuts', 'mutually cross-cuts',
                                          //            'is cut by', 'is younger than',
                                          //            'is older than', etc.]

  // Templates Configuration
  templates: {
    measurementTemplates: object[],        // Array of measurement template definitions
    activeMeasurementTemplates: string[],  // Currently active measurement templates
    useMeasurementTemplates: boolean,      // Enable/disable measurement templates

    // Additional template types (dynamic)
    [templateKey]: {
      templates: object[],                 // Template definitions
      active: string[],                    // Active template IDs
      isInUse: boolean,                    // Template usage flag
    }
  },

  // Tagging
  useContinuousTagging: boolean,           // Default: false
  tags: Tag[],                             // Array of project tags (see Tag schema below)

  // Reports
  reports: Report[],                       // Array of project reports (see Report schema below)
}
```

### Tag Object Schema

```typescript
{
  id: string,                              // Unique tag ID (UUID)
  type: string,                            // One of TAG_TYPES (see constants)
                                          // 'geologic_unit' | 'concept' |
                                          // 'documentation' | 'rosetta' |
                                          // 'experimental_apparatus' | 'other'
  name: string,                            // Tag name
  spots: string[],                         // Array of spot IDs tagged
  features: {                              // Feature-level tagging
    [spotId: string]: string[],            // Array of feature IDs for each spot
  }
}
```

### Report Object Schema

```typescript
{
  id: string,                              // UUID
  name: string,                            // Report name
  description: string,                     // Report description
  created_timestamp: number,               // Unix timestamp
  updated_timestamp: number,               // Unix timestamp
  images: object[],                        // Array of image objects
  spots: string[],                         // Array of spot IDs in report
  tags: string[],                          // Array of tag IDs in report
}
```

### Redux Project State

```typescript
{
  activeDatasetsIds: string[],             // Array of active dataset IDs
  targetDatasetId: string | undefined,     // Currently selected dataset for new spots
  project: Project,                        // Main project object (see above)
  datasets: {                              // Datasets keyed by ID
    [datasetId: string]: Dataset
  },
  deviceBackUpDirectoryExists: boolean,    // Backup directory status
  backupFileName: string,                  // Name of backup file
  downloadsDirectory: boolean,             // Android only
  isTestingMode: boolean,                  // Testing flag
  readOnlyDatasetsIds: string[],          // Read-only dataset IDs
  selectedProject: {                       // Selected project metadata
    project: string,
    source: string,
  },
  selectedTag: Tag,                        // Currently selected tag
  isMultipleFeaturesTaggingEnabled: boolean, // Multiple feature tagging flag
  addTagToSelectedSpot: boolean,          // Add tag to spot flag
  projectTransferProgress: number,         // Progress indicator (0-100)
  isImageTransferring: boolean,           // Image transfer status
}
```

**Source Files:**
- `/src/modules/project/projects.slice.js` - Redux state management
- `/src/modules/project/project.constants.js` - Constants
- `/src/assets/forms/project-description.json` - Description form schema
- `/src/assets/forms/project-settings.json` - Settings form schema

---

## Dataset Schema

### Dataset Object Structure

```typescript
{
  // Core Identifiers
  id: string | number,                     // Unique identifier for the dataset

  // Metadata
  name: string,                            // Display name (default: 'Default')
  date: string,                            // ISO 8601 timestamp when created
  modified_timestamp: number,              // Last modification time (Unix timestamp in ms)

  // Spot Associations
  spotIds: string[] | number[],            // Array of spot IDs in this dataset

  // Image Management (Mobile)
  images: {
    imageIds: string[] | number[],         // Array of downloaded image IDs
    neededImagesIds: string[] | number[],  // Array of image IDs that need download
  }
}
```

### Dataset Fields Reference

| Field Name | Type | Required | Default | Description |
|------------|------|----------|---------|-------------|
| `id` | string/number | Yes | Generated UUID | Unique identifier |
| `name` | string | Yes | 'Default' | Display name |
| `date` | string (ISO 8601) | Yes | Current datetime | Creation timestamp |
| `modified_timestamp` | number | Yes | Current Unix time | Last modification |
| `spotIds` | array | Yes | `[]` | Spot IDs in dataset |
| `images.imageIds` | array | Yes | `[]` | Downloaded images |
| `images.neededImagesIds` | array | Yes | `[]` | Images to download |

**Notes:**
- `spotIds` and `images` fields are **removed** when uploading to server
- Datasets are stored in Redux state keyed by `id`
- Multiple datasets can be active simultaneously
- Datasets can be marked as read-only

**Source Files:**
- `/src/modules/project/projects.slice.js` - Redux state
- `/src/modules/project/useProject.js` - Dataset operations (lines 63-78)
- `/src/modules/project/datasets/` - Dataset UI components
- `/src/services/useUpload.js` - Upload serialization (lines 59-87)

---

## Spot Schema

### Spot GeoJSON Structure

Spots follow the **GeoJSON Feature** specification with extensive custom properties:

```typescript
{
  type: 'Feature',

  // GeoJSON Geometry
  geometry: {
    type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' |
          'Polygon' | 'MultiPolygon' | 'GeometryCollection',
    coordinates: number[] | number[][] | number[][][],  // Based on geometry type
  },

  // Spot Properties (All custom fields)
  properties: SpotProperties,             // See detailed schema below
}
```

### Spot Properties Schema

```typescript
{
  // ==================== CORE FIELDS ====================

  id: number,                              // Unique spot identifier
  name: string,                            // Spot name/label
  date: string,                            // ISO string date (creation)
  time: string,                            // ISO string time
  modified_timestamp: number,              // Unix timestamp

  // ==================== GEOGRAPHIC FIELDS ====================

  lat: number,                             // Latitude (WGS84)
  lng: number,                             // Longitude (WGS84)
  altitude: number,                        // Altitude in meters
  gps_accuracy: number,                    // GPS accuracy in meters
  spot_radius: number,                     // Spot radius in meters

  // ==================== DOCUMENTATION ====================

  notes: string,                           // Spot notes (multiline)
  notesTimestamp: string,                  // Timestamp of notes (JS Date Object)

  // ==================== PARENT REFERENCES ====================

  image_basemap: number,                   // ID of parent image basemap
  strat_section_id: string,                // UUID of parent stratigraphic section
  nesting: number[],                       // Array of nested spot IDs

  // ==================== EXTERNAL DATA ====================

  data: {
    urls: string[],                        // Array of external URLs
    links: string[],                       // Array of links
  },

  // ==================== SAMPLES ====================

  samples: Sample[],                       // Array of sample objects (see Sample schema)

  // ==================== IMAGES ====================

  images: Image[],                         // Array of image objects (see Image schema)

  // ==================== MEASUREMENTS/ORIENTATIONS ====================

  orientation_data: Orientation[],         // Array of orientation measurements
                                          // (see Orientation schema)

  // ==================== SPECIALTY DATA OBJECTS ====================

  // Sedimentology
  sed: {
    bedding: object,                       // Bedding data
    lithologies: object,                   // Lithology composition
    structures: object,                    // Sedimentary structures
    interpretations: object,               // Environmental interpretations
    fossils: object,                       // Fossil data
    diagenesis: object,                    // Diagenetic features
    strat_section: object,                 // Stratigraphic section settings
    interval: object,                      // Stratigraphic interval
  },

  // Petrology
  pet: {
    igneous: object[],                     // Igneous rock data
    metamorphic: object[],                 // Metamorphic rock data
    alteration_or: object[],               // Alteration/ore data
    fault: object[],                       // Fault rock data
    minerals: object[],                    // Mineral data
    reactions: object[],                   // Reaction textures
  },

  // 3D Structures
  _3d_structures: ThreeDStructure[],       // Faults, folds, fabrics, tensors
                                          // (see 3D Structure schema)

  // Fabrics
  fabrics: Fabric[],                       // Fabric data (see Fabric schema)

  // Tephra
  tephra: {
    description: object,                   // Tephra deposit description
    composition: object,                   // Tephra composition
  },

  // Geologic Unit
  geologic_unit: object,                   // Geologic unit designation

  // Geomorphology/Seismology
  earthquakes: object,                     // Earthquake/seismic data

  // Feature Types (for LineString/Polygon geometries)
  trace: {                                 // Line features
    trace_type: string,
    trace_feature: string,
    // ... additional trace fields from form
  },

  surface_feature: {                       // Polygon features
    surface_feature_type: string,
    // ... additional surface feature fields from form
  },

  // Other
  site_safety: object,                     // Safety information
  report: object,                          // Report data

  // ... Plus any additional fields from 58+ form definitions
}
```

### Sample Object Schema

```typescript
{
  id: number,                              // Sample ID
  label: string,                           // Sample label
  sample_id_name: string,                  // Sample ID name
  sample_type: 'core' | 'ctd' | 'cuttings' | 'dredge' | 'grab' | 'hole' |
               'individual_sample' | 'oriented_core' | 'rock_powder' |
               'site' | 'terrestrial_section' | 'trawl' | 'other',
  Sample_IGSN: string,                     // International Generic Sample Number
  main_sampling_purpose: 'fabric' | 'petrology' | 'geochronology' |
                        'geochemistry' | 'active_eruption' | string,
  material_type: 'intact_rock' | 'fragmented_rock' | 'sediment' |
                'tephra' | 'carbon_or_animal' | 'other',
  inplaceness_of_sample: number,           // 1 (float) to 5 (definitely in place)
  oriented_sample: 'yes' | 'no',
  sample_size: string,                     // Size description
  degree_of_weathering: number,            // 1 (highly weathered) to 5 (fresh)
  sample_notes: string,                    // Notes about sample

  // SESAR Integration Fields (for IGSN registration)
  user_code: string,
  collector: string,
  igsn: string,
  longitude: number,
  latitude: number,
  longitude_end: number,                   // Optional (for line samples)
  latitude_end: number,                    // Optional (for line samples)
  collection_start_date: string,           // ISO string
  purpose: string,
  description: string,
  material: string,
  name: string,
}
```

### Image Object Schema

```typescript
{
  id: number,                              // Image ID
  title: string,                           // Image name/title
  image_type: 'photo' | 'sketch' | 'screenshot' | 'thin_section' |
              'geological_cross_section' | 'geophysical_cross_section' |
              'stratigraphic_section' | 'other',
  caption: string,                         // Image description
  image_source: string,                    // Source reference
  scale_of_image: string,                  // Overall scale
  scale_of_object: string,                 // Scale in meters
  width_of_image_view: number,             // Width dimension
  units_of_image_view: 'km' | 'm' | 'cm' | 'mm' | 'um',
  view_azimuth_trend: number,              // 0-360 degrees
  view_angle_plunge: number,               // -90 to 90 degrees
  orientation_of_view_subject: string,     // Description
  annotated: boolean,                      // Has annotations
}
```

### Orientation/Measurement Object Schema

```typescript
{
  id: string,                              // UUID
  type: 'planar_orientation' | 'linear_orientation' | 'tabular_orientation',
  label: string,                           // Measurement label

  // Planar Orientation Fields
  strike: number,                          // 0-360 degrees
  dip_direction: number,                   // 0-360 degrees (azimuth)
  dip: number,                             // 0-90 degrees

  // Linear Orientation Fields
  trend: number,                           // 0-360 degrees (azimuth)
  plunge: number,                          // 0-90 degrees
  rake: number,                            // 0-180 degrees

  // Quality & Classification
  quality: string,                         // Measurement quality
  feature_type: string,                    // Type of feature measured

  // Additional context fields from forms
  bedding_type: string,
  contact_type: string,
  facing_direction: string,
  ...                                      // Plus all other form fields
}
```

### 3D Structure Object Schema

```typescript
{
  id: number,                              // Structure ID
  type: 'fault' | 'fold' | 'fabric' | 'tensor' | 'other',
  label: string,                           // Structure label

  // Fault Fields
  fault_type: string,
  fault_movement_type: string,
  fault_displacement: number,
  slip_sense: string,

  // Fold Fields
  fold_type: string,
  fold_geometry: object,
  fold_vergence: string,

  // Fabric Fields
  fabric_type: string,

  // Tensor Fields
  tensor_type: string,

  ...                                      // Plus all other fields from forms
}
```

### Fabric Object Schema

```typescript
{
  id: number,                              // Fabric ID
  type: 'fault_rock' | 'igneous_rock' | 'metamorphic_rock',
  label: string,                           // Fabric label

  // Type-specific fields from forms
  ...
}
```

### Redux Spot State

```typescript
{
  spots: {                                 // Spots keyed by ID
    [spotId: string]: Spot
  },
  selectedSpot: Spot,                      // Currently selected spot
  recentViews: string[],                   // Recently viewed spot IDs
  selectedAttributes: string[],            // Selected spot attributes for display
  intersectedSpotsForTagging: string[],    // Spots intersected for tagging
}
```

**Source Files:**
- `/src/modules/spots/spots.slice.js` - Redux state
- `/src/modules/spots/useSpots.js` - Spot operations
- `/src/modules/help/SpotDataModelModal.js` - Complete schema builder
- `/src/assets/forms/` - 58+ form definition JSON files
- `/src/modules/samples/useSamples.js` - Sample operations
- `/src/modules/samples/IGSNModal.js` - SESAR/IGSN integration

---

## Constants & Enumerations

### Project Constants
**File:** `/src/modules/project/project.constants.js`

```javascript
// Tag Types
TAG_TYPES = [
  'geologic_unit',
  'concept',
  'documentation',
  'rosetta',
  'experimental_apparatus',
  'other',
]

// Default Geologic Feature Types
DEFAULT_GEOLOGIC_TYPES = [
  'geomorphic',
  'hydrologic',
  'paleontological',
  'igneous',
  'metamorphic',
  'sedimentological',
  'other',
]

// Default Relationship Types
DEFAULT_RELATIONSHIP_TYPES = [
  'cross-cuts',
  'mutually cross-cuts',
  'is cut by',
  'is younger than',
  'is older than',
  'is lower metamorphic grade than',
  'is higher metamorphic grade than',
  'is included within',
  'includes',
  'merges with',
]
```

### Spot Sort Options
**File:** `/src/modules/spots/spots.constants.js`

```javascript
SORT_ORDER = {
  ALPHABETICAL: 'Alphabetical',
  DATE_CREATED: 'Date Created',
  DATE_LAST_MODIFIED: 'Date Last Modified',
  RECENTLY_VIEWED: 'Recently Viewed',
}

SORTED_VIEWS = {
  CHRONOLOGICAL: 'CHRONOLOGICAL',
  MAP_EXTENT: 'MAP_EXTENT',
  RECENT_VIEWS: 'RECENT_VIEWS',
}
```

### Geometry Types (GeoJSON Standard)

```javascript
GEOMETRY_TYPES = [
  'Point',              // Single point
  'MultiPoint',         // Multiple points
  'LineString',         // Line/trace feature
  'MultiLineString',    // Multiple lines
  'Polygon',            // Area/surface feature
  'MultiPolygon',       // Multiple polygons
  'GeometryCollection', // Collection of geometries
]
```

---

## File References

### Project Files
- `/src/modules/project/projects.slice.js` - Redux state management
- `/src/modules/project/useProject.js` - Project operations hook
- `/src/modules/project/project.constants.js` - Project constants
- `/src/assets/forms/project-description.json` - Project description form
- `/src/assets/forms/project-settings.json` - Project settings form
- `/src/modules/tags/useTags.js` - Tag management
- `/src/modules/reports/useReportModal.js` - Report management
- `/src/services/useExport.js` - Export/backup functionality
- `/src/store/ConfigureStore.js` - Redux store configuration

### Dataset Files
- `/src/modules/project/projects.slice.js` - Redux state (lines 6-296)
- `/src/modules/project/useProject.js` - Dataset operations (lines 63-78)
- `/src/modules/project/datasets/DatasetList.js` - Dataset list component
- `/src/modules/project/datasets/DatasetListItem.js` - Dataset list item
- `/src/modules/project/datasets/DatasetDetail.js` - Dataset detail view
- `/src/modules/project/datasets/AddDatasetModal.js` - New dataset modal
- `/src/modules/project/datasets/DatasetsPage.js` - Main datasets page
- `/src/services/useServerRequests.js` - Server API (lines 118-120, 502-508)
- `/src/services/useUpload.js` - Upload serialization (lines 59-87)

### Spot Files
- `/src/modules/spots/spots.slice.js` - Redux state management
- `/src/modules/spots/useSpots.js` - Spot operations hook
- `/src/modules/spots/spots.constants.js` - Spot constants
- `/src/modules/help/SpotDataModelModal.js` - Complete schema builder
- `/src/assets/forms/index.js` - Form registry (58+ forms)
- `/src/modules/samples/useSamples.js` - Sample operations
- `/src/modules/samples/IGSNModal.js` - SESAR/IGSN integration

### Form Definition Files (Partial List)
**Directory:** `/src/assets/forms/`

**General Forms:**
- `geography.json` - Geographic fields
- `sample.json` - Sample data
- `image-properties.json` - Image metadata
- `surface-feature.json` - Surface features
- `trace.json` - Trace/line features
- `geologic_unit.json` - Geologic units

**Measurement Forms:**
- `measurement/planar-orientation.json` - Planar measurements
- `measurement/linear-orientation.json` - Linear measurements
- `measurement/tabular-zone-orientation.json` - Tabular measurements

**Sedimentology Forms (15+ forms):**
- `sed/bedding.json`
- `sed/lithologies-lithology.json`
- `sed/lithologies-composition.json`
- `sed/lithologies-texture.json`
- `sed/structures-physical.json`
- `sed/interpretations-environment.json`
- `sed/strat-section.json`
- etc.

**Petrology Forms (6+ forms):**
- `pet/rock-type-igneous-plutonic.json`
- `pet/rock-type-igneous-volcanic.json`
- `pet/rock-type-metamorphic.json`
- `pet/minerals.json`
- etc.

**3D Structure Forms (5+ forms):**
- `three-d-structures/fault.json`
- `three-d-structures/fold.json`
- `three-d-structures/fabric.json`
- etc.

**Fabric Forms:**
- `fabrics/fault-rock.json`
- `fabrics/igneous-rock.json`
- `fabrics/metamorphic-rock.json`

**Tephra Forms:**
- `tephra/description.json`
- `tephra/composition.json`

**Total:** 58+ form definition files

---

## Data Export Structure

When projects are exported/backed up, the complete data structure includes:

```typescript
{
  mapNamesDb: object,                      // Offline map metadata
  mapTilesDb: object,                      // Map tiles cache
  otherMapsDb: object,                     // Custom maps
  projectDb: ProjectState,                 // Complete project Redux state
  spotsDb: {                               // Spots keyed by ID
    [spotId: string]: Spot
  },
}
```

**Source File:** `/src/services/useExport.js`

---

## Version Information

- **App Version:** 2.23.2
- **Schema Documentation Version:** 1.0
- **Last Updated:** 2025-10-24
- **Current Branch:** IGSN_Updates

---

## Notes

1. **Dynamic Schema**: The spot schema is highly dynamic with 58+ form definitions that can be extended
2. **GeoJSON Compliance**: Spots follow GeoJSON Feature specification
3. **Timestamps**: Use Unix timestamps (milliseconds) for `modified_timestamp` fields
4. **IDs**: Projects and spots use UUIDs; datasets can use UUIDs or integers
5. **Server Upload**: Some fields (like `spotIds` and `images` in datasets) are removed during server upload
6. **Validation**: See individual form JSON files for field constraints and validation rules
7. **Extensibility**: Templates system allows for custom field definitions per project

---

**End of Schema Documentation**
