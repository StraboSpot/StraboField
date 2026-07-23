// Web has no freehand draw (no native sketch canvas). Stub the component and the drawing flag so shared map
// code can import this without pulling in the native-only @StraboSpot/react-native-sketch-canvas.
export const getIsFreehandDrawing = () => false;

const FreehandSketch = () => null;

export default FreehandSketch;
