// What becomes of a map edit: endMapEditing takes CANCEL or SAVE. The unsaved changes prompt answers with its own
// UNSAVED_CHANGES_CHOICES, which confirmEndMapEditing turns into one of these.
export const MAP_EDIT_CHOICES = {
  CANCEL: 'cancel',
  SAVE: 'save',
};
