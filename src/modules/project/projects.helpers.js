import {isEmpty} from '../../shared/helpers';

// The user who owns a dataset, which in a shared project may not be the project's owner. A dataset saved before the
// server sent its owner falls back to the project's.
export const getDatasetOwnerId = (dataset, projectOwnerId) => !isEmpty(dataset?.owner_straboUserId)
  ? dataset.owner_straboUserId
  : projectOwnerId;

// A dataset is read only when the server says so, and also when it belongs to someone else: in a shared project only
// a dataset's owner may change it, or the samples in it, which StraboSamples knows under that owner. With either id
// unknown - an older dataset, or a profile not loaded yet - it is left to the server. The ids may differ in type, so
// they are compared as strings.
export const isDatasetReadOnly = (dataset, straboUserId) => !!dataset?.isReadOnly
  || (!isEmpty(dataset?.owner_straboUserId) && !isEmpty(straboUserId)
    && String(dataset.owner_straboUserId) !== String(straboUserId));
