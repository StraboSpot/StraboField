/**
 * Web version of ImageZoomAndPanWrapper
 * On web, native zoom and pan is handled by the browser,
 * so we just render children directly without gesture handling
 */
const ImageZoomAndPanWrapper = ({children}) => {
  return children;
};

export default ImageZoomAndPanWrapper;
