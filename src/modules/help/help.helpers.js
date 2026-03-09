// Since hideRoot is true, level 0 is actually the first visible level
// Level 0: type, geometry, properties
// Level 1: contents of properties (what we want to show)
export const shouldExpandNode = (keyName, data, level) => level <= 1;
