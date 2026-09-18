import {sortTagsByDateCreated} from './tagQuery.helpers';

// Tag ids used to be a millisecond timestamp times ten, and Date Created sorted on the id itself. Ids are
// UUIDs now and carry no time, so new tags are stamped with created_timestamp while older ones still have to
// be placed by the timestamp buried in their id.
describe('sortTagsByDateCreated', () => {
  const earlier = 1756000000000;
  const later = 1757000000000;

  const oldTag = (name, createdAt) => ({id: createdAt * 10, name: name, type: 'concept'});
  const newTag = (name, createdAt) => (
    {created_timestamp: createdAt, id: 'a-uuid-' + name, name: name, type: 'concept'});

  const namesInOrder = tags => sortTagsByDateCreated(tags).map(tag => tag.name);

  it('puts the newest tag first', () => {
    expect(namesInOrder([newTag('older', earlier), newTag('newer', later)])).toEqual(['newer', 'older']);
  });

  it('still orders tags that predate created_timestamp, by the timestamp in their id', () => {
    expect(namesInOrder([oldTag('older', earlier), oldTag('newer', later)])).toEqual(['newer', 'older']);
  });

  // The case that matters: a project carries tags from both eras at once, and they interleave by real date
  it('interleaves old and new tags by when each was actually made', () => {
    const tags = [oldTag('oldest', earlier), newTag('newest', later), oldTag('middle', earlier + 500)];
    expect(namesInOrder(tags)).toEqual(['newest', 'middle', 'oldest']);
  });

  it('reads a new tag as newer than an old one made before it', () => {
    expect(namesInOrder([oldTag('old', earlier), newTag('new', later)])).toEqual(['new', 'old']);
  });

  // A UUID with no created_timestamp has no recoverable creation time, so it goes last rather than anywhere random
  it('sorts a tag with neither a date nor a numeric id oldest', () => {
    const tags = [{id: 'a-uuid-undated', name: 'undated'}, oldTag('dated', earlier)];
    expect(namesInOrder(tags)).toEqual(['dated', 'undated']);
  });

  it('leaves the array it is given alone', () => {
    const tags = [newTag('older', earlier), newTag('newer', later)];
    sortTagsByDateCreated(tags);
    expect(tags.map(tag => tag.name)).toEqual(['older', 'newer']);
  });
});
