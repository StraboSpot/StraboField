import * as forms from '../../../assets/forms';

export const EMPTY_LINE_STRING_FEATURE = {type: 'Feature', properties: {}, geometry: {type: 'LineString', coordinates: []}};

export const GRAIN_SIZE_KEYS = ['mud_silt_grain_size', 'sand_grain_size', 'congl_grain_size']; // breccia_grain_size same as congl_grain_size
export const CARBONATE_KEYS = ['dunham_classification'];
export const LITHOLOGIES_KEYS = ['primary_lithology'];
export const BASIC_LITHOLOGIES_LABELS = ['other', 'coal', 'mudstone', 'sandstone', 'conglomerate/breccia', 'limestone/dolostone'];

export const STRAT_PATTERNS = {
  // Limestone / Dolostone / Misc. Lithologies
  limestone: require('../../../assets/symbols/sed/basic/LimeSimple.png'),
  dolostone: require('../../../assets/symbols/sed/basic/DoloSimple.png'),
  evaporite: require('../../../assets/symbols/sed/misc/EvaBasic.png'),
  chert: require('../../../assets/symbols/sed/misc/ChertBasic.png'),
  phosphatic: require('../../../assets/symbols/sed/misc/PhosBasic.png'),
  volcaniclastic: require('../../../assets/symbols/sed/misc/VolBasic.png'),

  // Siliciclastic (Mudstone/Shale, Sandstone, Conglomerate, Breccia)
  mud_silt: require('../../../assets/symbols/sed/basic/MudSimple.png'),
  sandstone: require('../../../assets/symbols/sed/basic/SandSimple.png'),
  conglomerate: require('../../../assets/symbols/sed/basic/CongSimple.png'),
  breccia: require('../../../assets/symbols/sed/basic/BrecSimple.png'),

  // Mudstone/Shale
  clay: require('../../../assets/symbols/sed/siliciclastics/ClayBasic.png'),
  mud: require('../../../assets/symbols/sed/siliciclastics/MudBasic.png'),
  silt: require('../../../assets/symbols/sed/siliciclastics/SiltBasic.png'),

  // Sandstone
  sand_very_fin: require('../../../assets/symbols/sed/siliciclastics/VFBasic.png'),
  sand_fine_low: require('../../../assets/symbols/sed/siliciclastics/FLBasic.png'),
  sand_fine_upp: require('../../../assets/symbols/sed/siliciclastics/FUBasic.png'),
  sand_medium_l: require('../../../assets/symbols/sed/siliciclastics/MLBasic.png'),
  sand_medium_u: require('../../../assets/symbols/sed/siliciclastics/MUBasic.png'),
  sand_coarse_l: require('../../../assets/symbols/sed/siliciclastics/CLBasic.png'),
  sand_coarse_u: require('../../../assets/symbols/sed/siliciclastics/CUBasic.png'),
  sand_very_coa: require('../../../assets/symbols/sed/siliciclastics/VCBasic.png'),

  // Conglomerate
  congl_granule: require('../../../assets/symbols/sed/siliciclastics/CGrBasic.png'),
  congl_pebble: require('../../../assets/symbols/sed/siliciclastics/CPebBasic.png'),
  congl_cobble: require('../../../assets/symbols/sed/siliciclastics/CCobBasic.png'),
  congl_boulder: require('../../../assets/symbols/sed/siliciclastics/CBoBasic.png'),

  // Breccia
  brec_granule: require('../../../assets/symbols/sed/siliciclastics/BGrBasic.png'),
  brec_pebble: require('../../../assets/symbols/sed/siliciclastics/BPebBasic.png'),
  brec_cobble: require('../../../assets/symbols/sed/siliciclastics/BCobBasic.png'),
  brec_boulder: require('../../../assets/symbols/sed/siliciclastics/BBoBasic.png'),

  // Limestone
  li_bafflestone: require('../../../assets/symbols/sed/limestone/LiBoBasic.png'),
  li_bindstone: require('../../../assets/symbols/sed/limestone/LiBoBasic.png'),
  li_boundstone: require('../../../assets/symbols/sed/limestone/LiBoBasic.png'),
  li_floatstone: require('../../../assets/symbols/sed/limestone/LiFloBasic.png'),
  li_framestone: require('../../../assets/symbols/sed/limestone/LiBoBasic.png'),
  li_grainstone: require('../../../assets/symbols/sed/limestone/LiGrBasic.png'),
  li_mudstone: require('../../../assets/symbols/sed/limestone/LiMudBasic.png'),
  li_packstone: require('../../../assets/symbols/sed/limestone/LiPaBasic.png'),
  li_rudstone: require('../../../assets/symbols/sed/limestone/LiRudBasic.png'),
  li_wackestone: require('../../../assets/symbols/sed/limestone/LiWaBasic.png'),

  // Dolostone
  do_bafflestone: require('../../../assets/symbols/sed/dolostone/DoBoBasic.png'),
  do_bindstone: require('../../../assets/symbols/sed/dolostone/DoBoBasic.png'),
  do_boundstone: require('../../../assets/symbols/sed/dolostone/DoBoBasic.png'),
  do_floatstone: require('../../../assets/symbols/sed/dolostone/DoFloBasic.png'),
  do_framestone: require('../../../assets/symbols/sed/dolostone/DoBoBasic.png'),
  do_grainstone: require('../../../assets/symbols/sed/dolostone/DoGrBasic.png'),
  do_mudstone: require('../../../assets/symbols/sed/dolostone/DoMudBasic.png'),
  do_packstone: require('../../../assets/symbols/sed/dolostone/DoPaBasic.png'),
  do_rudstone: require('../../../assets/symbols/sed/dolostone/DoRudBasic.png'),
  do_wackestone: require('../../../assets/symbols/sed/dolostone/DoWaBasic.png'),
};

export const SED_LABEL_DICTIONARY = ['clastic', 'carbonate', 'lithologies', 'weathering'].reduce((acc, key) => {
  const survey = forms.default.sed.add_interval.survey;
  const choices = forms.default.sed.add_interval.choices;
  const groupFields = survey.filter((field) => {
    if (key === 'clastic') {
      return field.name === 'mud_silt_grain_size' || field.name === 'sand_grain_size'
        || field.name === 'congl_grain_size' || field.name === 'breccia_grain_size';
    }
    else if (key === 'carbonate') return field.name === 'dunham_classification';
    else if (key === 'lithologies') return field.name === 'primary_lithology';
    else if (key === 'weathering') return field.name === 'relative_resistance_weather';
  });
  const groupChoices = groupFields.reduce((acc2, field) => {
    const subgroupChoicesTemp = choices.filter(choice => choice.list_name === field.type.split(' ')[1]);
    return [...acc2, ...subgroupChoicesTemp];
  }, []);
  return {...acc, [key]: [...groupChoices]};
}, {});

// console.log('SED LABEL_DICTIONARY', SED_LABEL_DICTIONARY);
