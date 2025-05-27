import {createSlice} from '@reduxjs/toolkit';

import {DEFAULT_GEOLOGIC_TYPES, DEFAULT_RELATIONSHIP_TYPES} from './project.constants';
import {getNewId, isEmpty, isEqual} from '../../shared/Helpers';

const initialProjectState = {
  activeDatasetsIds: [],
  selectedDatasetId: undefined,
  project: {},
  datasets: {},
  deviceBackUpDirectoryExists: false,
  backupFileName: '',
  downloadsDirectory: false, //Android Only
  isTestingMode: false,
  selectedProject: {
    project: '',
    source: '',
  },
  selectedTag: {},
  isMultipleFeaturesTaggingEnabled: false,
  addTagToSelectedSpot: false,
  projectTransferProgress: 0,
  isImageTransferring: false,
};

const projectSlice = createSlice({
  name: 'project',
  initialState: initialProjectState,
  reducers: {
    addedCustomFeatureTypes(state, action) {
      state.project.other_features = action.payload;
      state.project.modified_timestamp = Date.now();
    },
    addedDataset(state, action) {
      state.datasets = {...state.datasets, [action.payload.id]: action.payload};
      state.project.modified_timestamp = Date.now();
    },
    addedDatasets(state, action) {
      state.datasets = action.payload;
    },
    addedNeededImagesToDataset(state, action) {
      const {datasetId, images, modified_timestamp} = action.payload;
      let datasetTimestamp = modified_timestamp;
      const timestamp = Date.now();
      const imagesInDataset = state.datasets[datasetId].images
        ? {...state.datasets[datasetId].images, ...images}
        : images;
      if (!datasetTimestamp) {
        datasetTimestamp = timestamp;
        console.log('Modified Timestamp:', datasetTimestamp);
        state.project.modified_timestamp = timestamp;
      }
      state.datasets = {
        ...state.datasets,
        [datasetId]: {...state.datasets[datasetId], modified_timestamp: datasetTimestamp, images: imagesInDataset},
      };
    },
    addedProject(state, action) {
      if (!action.payload.id) action.payload.id = getNewId();
      if (!action.payload.description) action.payload.description = {};
      if (!action.payload.description.project_name) action.payload.description.project_name = 'Unnamed';
      if (!action.payload.other_features) action.payload.other_features = DEFAULT_GEOLOGIC_TYPES;
      if (!action.payload.relationship_types) action.payload.relationship_types = DEFAULT_RELATIONSHIP_TYPES;
      if (!action.payload.templates) action.payload.templates = {};
      if (!action.payload.useContinuousTagging) action.payload.useContinuousTagging = false;
      state.project = action.payload;
    },
    addedProjectDescription(state, action) {
      state.project = action.payload;
    },
    addedNewSpotIdToDataset(state, action) {
      const {datasetId, spotId} = action.payload;
      const timestamp = Date.now();
      const spotIdsInDataset = [...state.datasets[action.payload.datasetId].spotIds || [], spotId];
      const dataset = {...state.datasets[datasetId], modified_timestamp: timestamp, spotIds: spotIdsInDataset};
      state.datasets = {...state.datasets, [datasetId]: dataset};
      state.project.modified_timestamp = timestamp;
    },
    addedNewSpotIdsToDataset(state, action) {
      const {datasetId, spotIds} = action.payload;
      const timestamp = Date.now();
      const spotIdsInDataset = [...new Set([...state.datasets[action.payload.datasetId].spotIds || [], ...spotIds])];
      const dataset = {...state.datasets[datasetId], modified_timestamp: timestamp, spotIds: spotIdsInDataset};
      state.datasets = {...state.datasets, [datasetId]: dataset};
      state.project.modified_timestamp = timestamp;
    },
    addedTagToSelectedSpot(state, action) {
      state.addTagToSelectedSpot = action.payload;
      state.project.modified_timestamp = Date.now();
    },
    addedTemplates(state, action) {
      const {key, templates} = action.payload;
      if (key === 'measurementTemplates') state.project.templates.measurementTemplates = templates;
      else {
        if (!state.project.templates[key]) state.project.templates[key] = {};
        state.project.templates[key].templates = templates;
      }
      state.project.modified_timestamp = Date.now();
    },
    clearedDatasets(state) {
      state.datasets = {};
      state.activeDatasetsIds = [];
      state.selectedDatasetId = undefined;
    },
    clearedProject(state) {
      state.project = {};
    },
    deletedDataset(state, action) {
      const {[action.payload]: deletedDataset, ...datasetsList} = state.datasets;  // Delete key with action.id from object
      state.datasets = datasetsList;
      state.activeDatasetsIds = state.activeDatasetsIds.filter(activeDatasetId => activeDatasetId !== action.payload);
      state.project.modified_timestamp = Date.now();
    },
    deletedSpotIdFromReports(state, action) {
      const spotId = action.payload;
      if (!isEmpty(state.project.reports)) {
        const updatedReports = state.project.reports.map((report) => {
          let updatedReport = JSON.parse(JSON.stringify(report));
          if (updatedReport.spots?.includes(spotId)) {
            updatedReport.spots = updatedReport.spots.filter(id => id !== spotId);
            if (isEmpty(updatedReport.spots)) delete updatedReport.spots;
            updatedReport.updated_timestamp = Date.now();
          }
          return updatedReport;
        });
        state.project.reports = updatedReports;
        state.project.modified_timestamp = Date.now();
      }
    },
    deletedSpotIdFromTags(state, action) {
      const spotId = action.payload;
      if (!isEmpty(state.project.tags)) {
        const updatedTags = state.project.tags.map((tag) => {
          let updatedTag = JSON.parse(JSON.stringify(tag));
          if (updatedTag.spots?.includes(spotId)) {
            updatedTag.spots = updatedTag.spots.filter(id => id !== spotId);
            if (isEmpty(updatedTag.spots)) delete updatedTag.spots;
          }
          if (updatedTag.features && updatedTag.features[spotId]) {
            delete updatedTag.features[spotId];
            if (isEmpty(updatedTag.features)) delete updatedTag.features;
          }
          return updatedTag;
        });
        state.project.tags = updatedTags;
        state.project.modified_timestamp = Date.now();
        state.selectedTag = updatedTags.find(tag => tag.id === state.selectedTag.id) || {};
      }
    },
    deletedSpotIdFromDataset(state, action) {
      const {datasetId, spotId} = action.payload;
      const timestamp = Date.now();
      const dataset = state.datasets[datasetId];
      const updatedSpotIds = dataset.spotIds.filter(id => id !== spotId);
      const updatedDataset = {...dataset, modified_timestamp: timestamp, spotIds: updatedSpotIds};
      state.datasets = {...state.datasets, [datasetId]: updatedDataset};
      state.project.modified_timestamp = timestamp;
    },
    deletedSpotIdFromDatasets(state, action) {
      const spotId = action.payload;
      const timestamp = Date.now();
      const updatedDatasets = Object.entries(state.datasets).reduce((acc, [datasetId, dataset]) => {
        const remainingSpotIds = dataset.spotIds?.filter(id => id !== spotId) || [];
        const updatedDatatset = isEqual(dataset.spotIds, remainingSpotIds) ? dataset
          : {...dataset, modified_timestamp: timestamp, spotIds: remainingSpotIds};
        return {...acc, [datasetId]: updatedDatatset};
      }, {});
      state.datasets = updatedDatasets;
      state.project.modified_timestamp = timestamp;
    },
    deletedTagIdFromReports(state, action) {
      const tagId = action.payload;
      if (!isEmpty(state.project.reports)) {
        const updatedReports = state.project.reports.map((report) => {
          let updatedReport = JSON.parse(JSON.stringify(report));
          if (updatedReport.tags?.includes(tagId)) {
            updatedReport.tags = updatedReport.tags.filter(id => id !== tagId);
            if (isEmpty(updatedReport.tags)) delete updatedReport.tags;
            updatedReport.updated_timestamp = Date.now();
          }
          return updatedReport;
        });
        state.project.reports = updatedReports;
        state.project.modified_timestamp = Date.now();
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
      const timestamp = Date.now();
      const updatedDatasets = Object.entries(state.datasets).reduce((acc, [datasetId, dataset]) => {
        const remainingSpotIds = dataset.spotIds?.filter(id => id !== spotId) || [];
        const updatedSpotIds = datasetId === toDatasetId.toString() ? [...remainingSpotIds, spotId]
          : remainingSpotIds;
        const updatedDatatset = isEqual(dataset.spotIds, updatedSpotIds) ? dataset
          : {...dataset, modified_timestamp: timestamp, spotIds: updatedSpotIds};
        return {...acc, [datasetId]: updatedDatatset};
      }, {});
      state.datasets = updatedDatasets;
      state.project.modified_timestamp = timestamp;
    },
    resetProjectState() {
      return initialProjectState;
    },
    setIsImageTransferring(state, action) {
      state.isImageTransferring = action.payload;
    },
    setActiveDatasets(state, action) {
      const {bool, dataset} = action.payload;
      if (bool) state.activeDatasetsIds = [...new Set([...state.activeDatasetsIds, dataset])];
      else state.activeDatasetsIds = state.activeDatasetsIds.filter(id => id !== dataset);
    },
    setActiveTemplates(state, action) {
      const {key, templates} = action.payload;
      if (key === 'measurementTemplates') {
        if (!state.project.templates.activeMeasurementTemplates) state.project.templates.activeMeasurementTemplates = [];
        state.project.templates.activeMeasurementTemplates = templates;
      }
      else {
        if (!state.project.templates[key]) state.project.templates[key] = {};
        state.project.templates[key].active = templates;
      }
      state.project.modified_timestamp = Date.now();
    },
    setBackupFileName(state, action) {
      state.backupFileName = action.payload;
    },
    setSelectedDataset(state, action) {
      state.selectedDatasetId = action.payload;
    },
    setSelectedProject(state, action) {
      const {project, source} = action.payload;
      state.selectedProject.project = project;
      state.selectedProject.source = source;
    },
    setSelectedTag(state, action) {
      state.selectedTag = action.payload;
    },
    setTestingMode(state, action) {
      state.isTestingMode = action.payload;
    },
    setMultipleFeaturesTaggingEnabled(state, action) {
      state.isMultipleFeaturesTaggingEnabled = action.payload;
    },
    setUseContinuousTagging(state, action) {
      state.project.useContinuousTagging = action.payload;
    },
    setUseTemplate(state, action) {
      const {key, bool} = action.payload;
      if (key === 'measurementTemplates') state.project.templates.useMeasurementTemplates = bool;
      else {
        if (!state.project.templates[key]) state.project.templates[key] = {};
        state.project.templates[key].isInUse = bool;
      }
      state.project.modified_timestamp = Date.now();
    },
    updatedDatasetProperties(state, action) {
      const timestamp = Date.now();
      console.log('UpdatedDataset', action.payload);
      state.datasets[action.payload.id].name = action.payload.name;
      state.datasets[action.payload.id].modified_timestamp = timestamp;
      state.project.modified_timestamp = timestamp;
    },
    updatedModifiedTimestampsBySpotsIds(state, action) {
      let datasetIdsFound = [];
      action.payload.map((spotId) => {
        for (const dataset of Object.values(state.datasets)) {
          const spotIdFound = dataset.spotIds?.find(id => id === spotId);
          if (spotIdFound && !datasetIdsFound.includes(dataset.id)) {
            datasetIdsFound.push(dataset.id);
            break;
          }
        }
      });
      const timestamp = Date.now();
      datasetIdsFound.map((datasetId) => {
        console.log('Previous Dataset Timestamp', state.datasets[datasetId].modified_timestamp);
        state.datasets[datasetId].modified_timestamp = timestamp;
        console.log('NEW Dataset Timestamp', state.datasets[datasetId].modified_timestamp);
      });
      console.log('Previous Project Timestamp', state.project.modified_timestamp);
      state.project.modified_timestamp = timestamp;
      console.log('NEW Project Timestamp', state.project.modified_timestamp);
    },
    updatedProject(state, action) {
      const {field, value} = action.payload;
      if (field === 'tags' && !isEmpty(state.selectedTag)) {
        state.selectedTag = value.find(tag => tag.id === state.selectedTag.id);
      }
      state.project[field] = value;
      state.project.modified_timestamp = Date.now();
    },
  },
});

export const {
  addedCustomFeatureTypes,
  addedDataset,
  addedDatasets,
  addedProject,
  addedProjectDescription,
  addedNeededImagesToDataset,
  addedNewSpotIdToDataset,
  addedNewSpotIdsToDataset,
  addedTagToSelectedSpot,
  addedTemplates,
  clearedDatasets,
  clearedProject,
  deletedDataset,
  deletedSpotIdFromDataset,
  deletedSpotIdFromDatasets,
  deletedSpotIdFromReports,
  deletedSpotIdFromTags,
  deletedTagIdFromReports,
  doesBackupDirectoryExist,
  doesDownloadsDirectoryExist,
  movedSpotIdBetweenDatasets,
  resetProjectState,
  setIsImageTransferring,
  setActiveDatasets,
  setActiveTemplates,
  setBackupFileName,
  setSelectedDataset,
  setSelectedProject,
  setSelectedTag,
  setTestingMode,
  setMultipleFeaturesTaggingEnabled,
  setUseContinuousTagging,
  setUseTemplate,
  updatedDatasetProperties,
  updatedModifiedTimestampsBySpotsIds,
  updatedProject,
} = projectSlice.actions;

export default projectSlice.reducer;
