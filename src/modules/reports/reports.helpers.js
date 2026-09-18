// The memos referencing a Spot
export const getReportsAtSpot = (reports, spotId) => (reports || []).filter(r => r.spots?.includes(spotId));

// The memos this user may see. A memo marked only_me is its author's alone. One saved before authorship was
// recorded names no author, so there is nobody to keep it from and it stays listed
export const getVisibleReports = (reports, straboUserId) => (reports || []).filter(
  r => r.report_privacy !== 'only_me' || !r.straboUserId || r.straboUserId === straboUserId);

// The memos this user may see, most recently edited first
export const getReportsToList = (reports, straboUserId) => getVisibleReports(reports, straboUserId)
  .sort((a, b) => new Date(b.modified_timestamp) - new Date(a.modified_timestamp));

// The memos carrying a tag. A memo holds its own tag ids - the reverse of a tag, which holds its Spots - so a
// tag's memos are found by scanning the memos rather than by reading the tag
export const getReportsWithTag = (reports, tagId) => {
  const idText = tagId?.toString();
  return (reports || []).filter(report => report.tags?.some(id => id.toString() === idText));
};
