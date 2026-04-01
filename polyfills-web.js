/* -- 20260330 JMA
if (!global.ErrorUtils) {
  console.log('ErrorUtils is not supported. Using polyfill.');

  global.ErrorUtils = function ErrorUtils() {
    return window.onError;
  };

  global.ErrorUtils.setGlobalHandler = function setGlobalHandler() {
    return window.onError;
  };
}
*/

/*
`global` is a Node.js/webpack 4 built-in that does not exist in the browser.
*/
if (typeof global === 'undefined') {                                                                                                                           
  window.global = window;              
}                                                                                                                                                              
                                                                                                                                                               
if (!global.ErrorUtils) {                                                                                                                                      
  console.log('ErrorUtils is not supported. Using polyfill.');                                                                                                 
                                                                                                                                                               
  global.ErrorUtils = function ErrorUtils() {                                                                                                                  
    return window.onError;                                                                                                                                     
  };                                                                                                                                                           
                                                                                                                                                               
  global.ErrorUtils.setGlobalHandler = function setGlobalHandler() {                                                                                           
    return window.onError;                                                                                                                                     
  };                                                                                                                                                           
}