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
