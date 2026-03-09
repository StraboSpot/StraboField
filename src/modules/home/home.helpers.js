export const getCustomMapsWithValidSources = maps => Object.values(maps).filter(m => isValidSource(m) && !m.overlay);

export const getCustomOverlaysWithValidSources = maps => Object.values(maps).filter(m => isValidSource(m) && m.overlay);

export const isValidSource = map => map.source === 'mapbox_styles' || map.source === 'strabospot_mymaps';
