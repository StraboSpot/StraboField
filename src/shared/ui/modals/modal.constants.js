// How long to let an outgoing native <Modal> finish its dismiss transition before presenting the next one. iOS
// presents each RN <Modal> as a native view-controller transition, and running a present and a dismiss at once trips
// UIViewControllerHierarchyInconsistency (a fatal crash — Sentry STRABOSPOT-2-6JN). Comfortably longer than the
// ~270ms fade so the two never overlap; the extra fraction of a second on a modal handoff is imperceptible.
export const MODAL_TRANSITION_DELAY = 400;
