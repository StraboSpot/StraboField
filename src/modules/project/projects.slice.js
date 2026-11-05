import {createSlice} from '@reduxjs/toolkit';

import {DEFAULT_GEOLOGIC_TYPES, DEFAULT_RELATIONSHIP_TYPES} from './project.constants';
import {getNewId, isEmpty, isEqual, isSameId} from '../../shared/helpers';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {
  deleteTemplateKey,
  getActiveTemplateList,
  getIsTemplateInUse,
  getTemplateList,
  setActiveTemplateList,
  setIsTemplateInUse,
  setTemplateList,
} from '../templates/templates.helpers';

// A memo used to stamp its edit time as updated_timestamp, while the rest of the project calls that
// modified_timestamp. Renamed on the way in - server, import or device - and the old key dropped, so no
// read site has to know both names.
export const migrateReportTimestamps = reports => reports?.map((reportToMigrate) => {
  if (!reportToMigrate) return reportToMigrate;
  const {updated_timestamp: updatedTimestamp, ...report} = reportToMigrate;
  return updatedTimestamp && !report.modified_timestamp ? {...report, modified_timestamp: updatedTimestamp} : report;
});

const normalizeProject = (project) => {
  if (!project.id) project.id = getNewId();
  if (!project.description) project.description = {};
  if (!project.description.project_name) project.description.project_name = 'Unnamed';
  if (!project.other_features) project.other_features = DEFAULT_GEOLOGIC_TYPES;
  if (!project.relationship_types) project.relationship_types = DEFAULT_RELATIONSHIP_TYPES;
  if (!project.templates) project.templates = {};
  if (!project.useContinuousTagging) project.useContinuousTagging = false;
  if (project.reports) project.reports = migrateReportTimestamps(project.reports);
  return project;
};

const initialProjectState = {
  activeDatasetsIds: [],
  addTagToSelectedSpot: false,
  backupFileName: '',
  changedImageIds: [],
  datasets: {},
  deviceBackUpDirectoryExists: false,
  downloadsDirectory: false, //Android Only
  isImageTransferring: false,
  isMultipleFeaturesTaggingEnabled: false,
  isTestingMode: false,
  project: {},
  projectTransferProgress: 0,
  // Sample Spots saved since the last upload, so strabospot.org does not have them as they are on the device yet.
  // Native only: a web save is an upload.
  sampleSpotIdsToUpload: [],
  selectedTag: {},
  targetDatasetId: undefined,
};

// Every action type of the slice starts with it
export const PROJECT_SLICE_NAME = 'project';

// The reducers here leave the dataset and project timestamps to propagateModifiedTimestamps, which updates them for
// whatever an action changed
const projectSlice = createSlice({
  name: PROJECT_SLICE_NAME,
  initialState: initialProjectState,
  reducers: {
    // Images replaced locally but keeping their id; the server reports those as present, so they
    // have to be forced into the next upload.
    addedChangedImageId(state, action) {
      if (!state.changedImageIds.includes(action.payload)) state.changedImageIds.push(action.payload);
    },
    addedCustomFeatureTypes(state, action) {
      state.project.other_features = action.payload;
    },
    addedDataset(state, action) {
      state.datasets = {...state.datasets, [action.payload.id]: action.payload};
    },
    addedDatasetFromServer(state, action) {
      state.datasets = {...state.datasets, [action.payload.id]: action.payload};
    },
    addedDatasets(state, action) {
      state.datasets = action.payload;
    },
    addedNewSpotIdsToDataset(state, action) {
      const {datasetId, spotIds} = action.payload;
      const spotIdsInDataset = [...new Set([...state.datasets[action.payload.datasetId].spotIds || [], ...spotIds])];
      state.datasets = {...state.datasets, [datasetId]: {...state.datasets[datasetId], spotIds: spotIdsInDataset}};
    },
    addedNewSpotIdToDataset(state, action) {
      const {datasetId, spotId} = action.payload;
      const spotIdsInDataset = [...state.datasets[action.payload.datasetId].spotIds || [], spotId];
      state.datasets = {...state.datasets, [datasetId]: {...state.datasets[datasetId], spotIds: spotIdsInDataset}};
    },
    addedProject(state, action) {
      state.project = normalizeProject(action.payload);
    },
    // The selected tag is a copy the tag pages save from, so it is swapped for the server's merged copy too, or
    // the next save writes it back over the merge
    addedProjectFromServer(state, action) {
      state.project = normalizeProject(action.payload);
      if (!isEmpty(state.selectedTag)) {
        state.selectedTag = state.project.tags?.find(tag => tag.id === state.selectedTag.id) || {};
      }
    },
    addedProjectDescription(state, action) {
      state.project = action.payload;
    },
    // A memo holds its own tag ids, so tagging one from the tag's own page writes to the memo. Mapped in place,
    // since an edited memo has to stay where it is in the list
    addedRemovedTagIdOnReport(state, action) {
      const {reportId, tagId} = action.payload;
      const tagIdText = tagId?.toString();
      state.project.reports = (state.project.reports || []).map((report) => {
        if (report.id !== reportId) return report;
        const updatedReport = JSON.parse(JSON.stringify(report));
        const tagIds = updatedReport.tags || [];
        updatedReport.tags = tagIds.some(id => id.toString() === tagIdText)
          ? tagIds.filter(id => id.toString() !== tagIdText) : [...tagIds, tagId];
        if (isEmpty(updatedReport.tags)) delete updatedReport.tags;
        updatedReport.modified_timestamp = Date.now();
        return updatedReport;
      });
    },
    addedSampleSpotIdToUpload(state, action) {
      if (!state.sampleSpotIdsToUpload.includes(action.payload)) state.sampleSpotIdsToUpload.push(action.payload);
    },
    addedSpotToTags(state, action) {
      const {spotId, tagIds} = action.payload;
      if (!isEmpty(state.project.tags)) {
        const timestamp = Date.now();
        const updatedTags = state.project.tags.map((tag) => {
          let updatedTag = JSON.parse(JSON.stringify(tag));
          if (tagIds.includes(tag.id)) {
            if (!updatedTag.spots) updatedTag.spots = [];
            updatedTag.spots.push(spotId);
            updatedTag.modified_timestamp = timestamp;
          }
          return updatedTag;
        });
        state.project.tags = updatedTags;
      }
    },
    addedTagToSelectedSpot(state, action) {
      state.addTagToSelectedSpot = action.payload;
    },
    addedTemplates(state, action) {
      const {key, templates} = action.payload;
      setTemplateList(state.project.templates, key, templates);
    },
    deletedDataset(state, action) {
      const {[action.payload]: deletedDataset, ...datasetsList} = state.datasets;  // Delete key with action.id from object
      state.datasets = datasetsList;
      state.activeDatasetsIds = state.activeDatasetsIds.filter(activeDatasetId => activeDatasetId !== action.payload);
    },
    deletedSpotIdFromDataset(state, action) {
      const {datasetId, spotId} = action.payload;
      const dataset = state.datasets[datasetId];
      const updatedSpotIds = dataset.spotIds.filter(id => !isSameId(id, spotId));
      state.datasets = {...state.datasets, [datasetId]: {...dataset, spotIds: updatedSpotIds}};
    },
    deletedSpotIdFromDatasets(state, action) {
      const spotId = action.payload;
      // Only the datasets holding the Spot are written, so the rest are not marked modified
      Object.values(state.datasets).forEach((dataset) => {
        if (dataset.spotIds?.some(id => isSameId(id, spotId))) {
          dataset.spotIds = dataset.spotIds.filter(id => !isSameId(id, spotId));
        }
      });
    },
    deletedSpotIdFromReports(state, action) {
      const spotId = action.payload;
      if (!isEmpty(state.project.reports)) {
        const updatedReports = state.project.reports.map((report) => {
          let updatedReport = JSON.parse(JSON.stringify(report));
          if (updatedReport.spots?.some(id => isSameId(id, spotId))) {
            updatedReport.spots = updatedReport.spots.filter(id => !isSameId(id, spotId));
            if (isEmpty(updatedReport.spots)) delete updatedReport.spots;
            updatedReport.modified_timestamp = Date.now();
          }
          return updatedReport;
        });
        state.project.reports = updatedReports;
      }
    },
    deletedSpotIdFromTags(state, action) {
      const spotId = action.payload;
      if (!isEmpty(state.project.tags)) {
        const timestamp = Date.now();
        const updatedTags = state.project.tags.map((tag) => {
          let updatedTag = JSON.parse(JSON.stringify(tag));
          if (updatedTag.spots?.some(id => isSameId(id, spotId))) {
            updatedTag.spots = updatedTag.spots.filter(id => !isSameId(id, spotId));
            if (isEmpty(updatedTag.spots)) delete updatedTag.spots;
            updatedTag.modified_timestamp = timestamp;
          }
          if (updatedTag.features && updatedTag.features[spotId]) {
            delete updatedTag.features[spotId];
            if (isEmpty(updatedTag.features)) delete updatedTag.features;
            updatedTag.modified_timestamp = timestamp;
          }
          return updatedTag;
        });
        state.project.tags = updatedTags;
        state.selectedTag = updatedTags.find(tag => tag.id === state.selectedTag?.id) || {};
      }
    },
    deletedTagIdFromReports(state, action) {
      const tagId = action.payload;
      if (!isEmpty(state.project.reports)) {
        const updatedReports = state.project.reports.map((report) => {
          let updatedReport = JSON.parse(JSON.stringify(report));
          if (updatedReport.tags?.includes(tagId)) {
            updatedReport.tags = updatedReport.tags.filter(id => id !== tagId);
            if (isEmpty(updatedReport.tags)) delete updatedReport.tags;
            updatedReport.modified_timestamp = Date.now();
          }
          return updatedReport;
        });
        state.project.reports = updatedReports;
      }
    },
    deletedTemplate(state, action) {
      const {key, template} = action.payload;
      const templates = state.project.templates;
      const remainingTemplates = (getTemplateList(templates, key) || []).filter(t => t.id !== template.id);
      // The last template of a key takes its active list and in-use flag with it: both name templates that
      // no longer exist.
      if (isEmpty(remainingTemplates)) deleteTemplateKey(templates, key);
      else {
        setTemplateList(templates, key, remainingTemplates);
        const remainingActive = (getActiveTemplateList(templates, key) || []).filter(t => t.id !== template.id);
        setActiveTemplateList(templates, key, remainingActive);
        // Templates stay switched on only while there is an active one left to apply
        if (getIsTemplateInUse(templates, key) && isEmpty(remainingActive)) setIsTemplateInUse(templates, key, false);
      }
    },
    doesBackupDirectoryExist(state, action) {
      state.deviceBackUpDirectoryExists = action.payload;
    },
    doesDownloadsDirectoryExist(state, action) {
      state.downloadsDirectory = action.payload;
    },
    movedSpotIdBetweenDatasets(state, action) {
      const {toDatasetId, spotId} = action.payload;
      // Only the datasets whose Spots change are written, so the rest are not marked modified
      Object.entries(state.datasets).forEach(([datasetId, dataset]) => {
        const remainingSpotIds = dataset.spotIds?.filter(id => !isSameId(id, spotId)) || [];
        const updatedSpotIds = datasetId === toDatasetId.toString() ? [...remainingSpotIds, spotId]
          : remainingSpotIds;
        if (!isEqual(dataset.spotIds || [], updatedSpotIds)) dataset.spotIds = updatedSpotIds;
      });
    },
    removedChangedImageIds(state, action) {
      state.changedImageIds = state.changedImageIds.filter(id => !action.payload.includes(id));
    },
    removedSampleSpotIdsToUpload(state, action) {
      state.sampleSpotIdsToUpload = state.sampleSpotIdsToUpload.filter(id => !action.payload.includes(id));
    },
    resetProjectState() {
      return initialProjectState;
    },
    restoredSpotReferences(state, action) {
      // Undo delete: put the datasets/reports/tags back exactly as they were before the Spot was deleted.
      const {datasets, reports, tags} = action.payload;
      state.datasets = datasets;
      if (reports) state.project.reports = reports;
      if (tags) state.project.tags = tags;
    },
    setActiveDatasets(state, action) {
      const {bool, dataset} = action.payload;
      if (bool) state.activeDatasetsIds = [...new Set([...state.activeDatasetsIds, dataset])];
      else state.activeDatasetsIds = state.activeDatasetsIds.filter(id => id !== dataset);
    },
    setActiveDatasetsMultiple(state, action) {
      const datasetIds = action.payload;
      state.activeDatasetsIds = datasetIds;
      // Which datasets are shown says nothing about where new Spots belong, and the first of them could well
      // be read only. Drop a target that is no longer among them rather than substituting one - having no
      // target at all is a state the app handles
      if (!datasetIds.includes(state.targetDatasetId)) state.targetDatasetId = undefined;
    },
    setActiveTemplates(state, action) {
      const {key, templates} = action.payload;
      setActiveTemplateList(state.project.templates, key, templates);
    },
    setBackupFileName(state, action) {
      state.backupFileName = action.payload;
    },
    setIsImageTransferring(state, action) {
      state.isImageTransferring = action.payload;
    },
    setMultipleFeaturesTaggingEnabled(state, action) {
      state.isMultipleFeaturesTaggingEnabled = action.payload;
    },
    setSelectedTag(state, action) {
      state.selectedTag = action.payload;
    },
    setTargetDataset(state, action) {
      state.targetDatasetId = action.payload;
    },
    setTestingMode(state, action) {
      state.isTestingMode = action.payload;
    },
    setUseContinuousTagging(state, action) {
      state.project.useContinuousTagging = action.payload;
    },
    setUseTemplate(state, action) {
      const {key, bool} = action.payload;
      setIsTemplateInUse(state.project.templates, key, bool);
    },
    updatedDatasetProperties(state, action) {
      console.log('UpdatedDataset', action.payload);
      state.datasets[action.payload.id].name = action.payload.name;
    },
    updatedProject(state, action) {
      const {field, value} = action.payload;
      if (field === 'tags' && !isEmpty(state.selectedTag)) {
        state.selectedTag = value.find(tag => tag.id === state.selectedTag.id);
      }
      state.project[field] = value;
    },
    // Sets one preference, leaving the rest as they are now. updatedProject replaces the whole preferences object,
    // so a caller holding an older copy of it would quietly undo every other setting changed since.
    updatedProjectPreference(state, action) {
      const {key, value} = action.payload;
      state.project.preferences = {...state.project.preferences, [key]: value};
    },
  },
  extraReducers: (builder) => {
    // Tagging several features is something done on one page, so leaving the page ends it - here rather than in an
    // effect, which would run only after the next page had already read it and skipped the feature it was opened to
    builder.addCase(setNotebookPageVisible, (state) => {
      state.isMultipleFeaturesTaggingEnabled = false;
    });
  },
});

export const {
  addedChangedImageId,
  addedCustomFeatureTypes,
  addedDataset,
  addedDatasetFromServer,
  addedDatasets,
  addedNewSpotIdsToDataset,
  addedNewSpotIdToDataset,
  addedProject,
  addedProjectDescription,
  addedProjectFromServer,
  addedRemovedTagIdOnReport,
  addedSampleSpotIdToUpload,
  addedSpotToTags,
  addedTagToSelectedSpot,
  addedTemplates,
  deletedDataset,
  deletedSpotIdFromDataset,
  deletedSpotIdFromDatasets,
  deletedSpotIdFromReports,
  deletedSpotIdFromTags,
  deletedTagIdFromReports,
  deletedTemplate,
  doesBackupDirectoryExist,
  doesDownloadsDirectoryExist,
  movedSpotIdBetweenDatasets,
  removedChangedImageIds,
  removedSampleSpotIdsToUpload,
  resetProjectState,
  restoredSpotReferences,
  setActiveDatasets,
  setActiveDatasetsMultiple,
  setActiveTemplates,
  setBackupFileName,
  setIsImageTransferring,
  setMultipleFeaturesTaggingEnabled,
  setSelectedTag,
  setTargetDataset,
  setTestingMode,
  setUseContinuousTagging,
  setUseTemplate,
  updatedDatasetProperties,
  updatedProject,
  updatedProjectPreference,
} = projectSlice.actions;

export default projectSlice.reducer;
