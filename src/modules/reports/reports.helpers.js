// The memos referencing a Spot
export const getReportsAtSpot = (reports, spotId) => (reports || []).filter(r => r.spots?.includes(spotId));

// The memos this user may see, most recently edited first. A memo marked only_me is its author's alone. One saved
// before authorship was recorded names no author, so there is nobody to keep it from and it stays listed
export const getReportsToList = (reports, straboUserId) => (reports || [])
  .filter(r => r.report_privacy !== 'only_me' || !r.straboUserId || r.straboUserId === straboUserId)
  .sort((a, b) => new Date(b.modified_timestamp) - new Date(a.modified_timestamp));
