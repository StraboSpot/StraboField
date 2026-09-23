import {STRABOSAMPLES_FIELD_MAP} from './samples.constants';
import {isEmpty} from '../../shared/helpers';

// A sample is either a record kept on its parent Spot or a rich sample, which is a Spot of its own holding that
// record. Everything about the sample itself lives in the record either way.
export const getSampleMetadata = sample => sample.properties?.isSample
  ? sample.properties.samples?.[0] ?? {id: sample.properties.id}
  : sample;

// What a sample is called in a list: the label if it has one, and otherwise the name it was given. A label is
// filled in with that name on save, so the two read the same until someone types over it. A rich sample's Spot
// is named after its sample, which is what the name falls back to for one whose record has gone.
export const getSampleTitle = (sample) => {
  const metadata = getSampleMetadata(sample);
  return metadata.label || metadata.sample_id_name || sample.properties?.name || 'Unknown';
};

// The id of the StraboSamples sample a Field sample is linked to. It is sent back to the server verbatim, and may be
// a number string or a UUID, so it is only ever handled as a string and never reformatted.
export const getStraboSamplesId = strabosample => typeof strabosample.id === 'string' ? strabosample.id
  : String(strabosample.id);

// A Field sample linked to a StraboSamples sample. Only the fields the user left empty are filled in, so nothing typed
// in the field is overwritten. A sample linked to Field before carries that Field record as field_data, which is
// preferred over mapping its StraboSamples fields. The sample keeps its own id, which is what the Spot and its parent
// know it by - the link lives only in strabosamples_id.
export const getLinkedSample = (fieldSample, strabosample) => {
  const {id: _id, strabosamples_id: _strabosamplesId, ...fieldData} = strabosample.field_data || {};
  const values = !isEmpty(strabosample.field_data) ? fieldData
    : Object.fromEntries(Object.entries(STRABOSAMPLES_FIELD_MAP).map(([key, fieldKey]) => [fieldKey, strabosample[key]]));
  const valuesToFill = Object.fromEntries(
    Object.entries(values).filter(([key, value]) => !isEmpty(value) && isEmpty(fieldSample[key])),
  );
  return {...fieldSample, ...valuesToFill, strabosamples_id: getStraboSamplesId(strabosample)};
};

// A Field sample unlinked from StraboSamples becomes a separate sample again under its own id
export const getUnlinkedSample = (fieldSample) => {
  const {strabosamples_id: _strabosamplesId, ...unlinkedSample} = fieldSample;
  return unlinkedSample;
};

// The other Field samples in the project already linked to this StraboSamples sample. Only one of them can own the
// link - the last one uploaded wins - so the user is warned before a second is linked.
export const getSamplesLinkedTo = (spots, strabosamplesId, fieldSampleId) => Object.values(spots).flatMap(
  spot => (spot.properties?.samples || []).filter(
    sample => sample.strabosamples_id === strabosamplesId && sample.id !== fieldSampleId,
  ),
);

// Whether the server already has this StraboSamples sample linked to a different Field sample. The reference_id is
// whatever the server stored, so both ids are compared as strings.
export const isLinkedToOtherFieldSample = (strabosample, fieldSampleId) => (strabosample.subsystem_links || []).some(
  link => link.subsystem === 'field' && String(link.reference_id) !== String(fieldSampleId),
);
