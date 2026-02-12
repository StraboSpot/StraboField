import useStratSection from './useStratSection';
import useSedValidation from '../../sed/useSedValidation';

const useStratSectionSymbology = () => {
  const {getSiliciclasticGrainSize} = useSedValidation();
  const {getStratSectionSettings} = useStratSection();

  const getGrainSize = (lithology) => {
    if (lithology.primary_lithology === 'limestone' || lithology.primary_lithology === 'dolostone') {
      return lithology.dunham_classification;
    }
    else if (lithology.primary_lithology === 'siliciclastic' && getSiliciclasticGrainSize(lithology)) {
      return getSiliciclasticGrainSize(lithology);
    }
    return lithology.primary_lithology;
  };

  const getStratIntervalFill = (featureProperties) => {
    let fill;
    let color = 'rgba(255, 255, 255, 1)';  // default white
    const n = featureProperties.isInterbed ? 1 : 0;
    if (featureProperties.sed && featureProperties.sed.character && featureProperties.sed.character !== 'unexposed_cove'
      && featureProperties.sed.character !== 'not_measured') {
      if (featureProperties.sed.lithologies && featureProperties.sed.lithologies[n]
        && featureProperties.sed.lithologies[n].primary_lithology) {
        const lithologies = featureProperties.sed.lithologies;
        const lithologyField = lithologies[n].primary_lithology;
        const grainSize = getGrainSize(lithologies[n]);
        const stratSectionSettings = getStratSectionSettings(featureProperties.strat_section_id);
        if (stratSectionSettings && stratSectionSettings.display_lithology_patterns) {
          if (stratSectionSettings.column_profile === 'basic_lithologies') {
            // Limestone / Dolostone / Misc. Lithologies
            if (lithologyField === 'limestone') fill = 'limestone';
            else if (lithologyField === 'dolostone') fill = 'dolostone';
            //else if (lithologyField === 'organic_coal') // Solid color - no fill;
            else if (lithologyField === 'evaporite') fill = 'evaporite';
            else if (lithologyField === 'chert') fill = 'chert';
            //else if (lithologyField === 'ironstone') // Solid color - no fill;
            else if (lithologyField === 'phosphatic') fill = 'phosphatic';
            else if (lithologyField === 'volcaniclastic') fill = 'volcaniclastic';

            // Siliciclastic (Mudstone/Shale, Sandstone, Conglomerate, Breccia)
            else if (lithologies[n].mud_silt_grain_size) fill = 'mud_silt';
            else if (lithologies[n].sand_grain_size) fill = 'sandstone';
            else if (lithologies[n].congl_grain_size) fill = 'conglomerate';
            else if (lithologies[n].breccia_grain_size) fill = 'breccia';
          }
          else if (grainSize) {
            if (lithologyField === 'limestone') fill = 'li_' + grainSize;
            else if (lithologyField === 'dolostone') fill = 'do_' + grainSize;
            else if (lithologyField === 'siliciclastic' && lithologies[n].siliciclastic_type === 'conglomerate') {
              fill = 'congl_' + grainSize;
            }
            else if (lithologyField === 'siliciclastic' && lithologies[n].siliciclastic_type === 'breccia') {
              fill = 'brec_' + grainSize;
            }
            else if (lithologyField !== 'organic_coal' && lithologyField !== 'ironstone') fill = grainSize;
          }
        }
        // Basic Lithologies Column Profile
        if (stratSectionSettings && !fill) {
          if (stratSectionSettings.column_profile === 'basic_lithologies') {
            // Limestone / Dolostone / Misc. Lithologies
            if (lithologyField === 'limestone') color = 'rgba(77, 255, 222, 1)';           // CMYK 70,0,13,0 USGS Color 820
            else if (lithologyField === 'dolostone') color = 'rgba(77, 255, 179, 1)';       // CMYK 70,0,30,0 USGS Color 840
            else if (lithologyField === 'organic_coal') color = 'rgba(0, 0, 0, 1)';        // CMYK 100,100,100,0 USGS Color 999
            else if (lithologyField === 'evaporite') color = 'rgba(153, 77, 255, 1)';      // CMYK 40,70,0,0 USGS Color 508;
            else if (lithologyField === 'chert') color = 'rgba(102, 77, 77, 1)';           // CMYK 60,70,70,0
            else if (lithologyField === 'ironstone') color = 'rgba(153, 0, 0, 1)';         // CMYK 40,100,100,0
            else if (lithologyField === 'phosphatic') color = 'rgba(153, 255, 179, 1)';    // CMYK 40,0,30,0
            else if (lithologyField === 'volcaniclastic') color = 'rgba(255, 128, 255, 1)';// CMYK 0,50,0,0

            // Siliciclastic (Mudstone/Shale, Sandstone, Conglomerate, Breccia)
            else if (lithologies[n].mud_silt_grain_size) color = 'rgba(128, 222, 77, 1)';          // CMYK 50,13,70,0 USGS Color 682
            else if (lithologies[n].sand_grain_size) color = 'rgba(255, 255, 77, 1)';              // CMYK 0,0,70,0 USGS Color 80
            else if (lithologies[n].congl_grain_size) color = 'rgba(255, 102, 0, 1)';              // CMYK 0,60,100,0 USGS Color 97
            else if (lithologies[n].breccia_grain_size) color = 'rgba(213, 0, 0, 1)';              // CMYK 13,100,100,4
          }
          else {
            // Mudstone/Shale
            if (grainSize === 'clay') color = 'rgba(128, 222, 77, 1)';                // CMYK 50,13,70,0 USGS Color 682
            else if (grainSize === 'mud') color = 'rgba(77, 255, 0, 1)';              // CMYK 70,0,100,0 USGS Color 890
            else if (grainSize === 'silt') color = 'rgba(153, 255, 102, 1)';          // CMYK 40,0,60,0 USGS Color 570
            // Sandstone
            else if (grainSize === 'sand_very_fin') color = 'rgba(255, 255, 179, 1)'; // CMYK 0,0,30,0 USGS Color 40
            else if (grainSize === 'sand_fine_low') color = 'rgba(255, 255, 153, 1)'; // CMYK 0,0,40,0 USGS Color 50
            else if (grainSize === 'sand_fine_upp') color = 'rgba(255, 255, 128, 1)'; // CMYK 0,0,50,0 USGS Color 60
            else if (grainSize === 'sand_medium_l') color = 'rgba(255, 255, 102, 1)'; // CMYK 0,0,60,0 USGS Color 70
            else if (grainSize === 'sand_medium_u') color = 'rgba(255, 255, 77, 1)';  // CMYK 0,0,70,0 USGS Color 80
            else if (grainSize === 'sand_coarse_l') color = 'rgba(255, 255, 0, 1)';   // CMYK 0,0,100,0 USGS Color 90
            else if (grainSize === 'sand_coarse_u') color = 'rgba(255, 235, 0, 1)';   // CMYK 0,8,100,0 USGS Color 91
            else if (grainSize === 'sand_very_coa') color = 'rgba(255, 222, 0, 1)';   // CMYK 0,13,100,0 USGS Color 92
            // Conglomerate
            else if (featureProperties.sed.lithologies[n].primary_lithology === 'siliciclastic'
              && featureProperties.sed.lithologies[n].siliciclastic_type === 'conglomerate') {
              if (grainSize === 'granule') color = 'rgba(255, 153, 0, 1)';            // CMYK 0,40,100,0 USGS Color 95
              else if (grainSize === 'pebble') color = 'rgba(255, 128, 0, 1)';        // CMYK 0,50,100,0 USGS Color 96
              else if (grainSize === 'cobble') color = 'rgba(255, 102, 0, 1)';        // CMYK 0,60,100,0 USGS Color 97
              else if (grainSize === 'boulder') color = 'rgba(255, 77, 0, 1)';        // CMYK 0,70,100,0 USGS Color 98
            }
            // Breccia
            else if (featureProperties.sed.lithologies[n].primary_lithology === 'siliciclastic'
              && featureProperties.sed.lithologies[n].siliciclastic_type === 'breccia') {
              if (grainSize === 'granule') color = 'rgba(230, 0, 0, 1)';              // CMYK 10,100,100,0 USGS Color 95
              else if (grainSize === 'pebble') color = 'rgba(204, 0, 0, 1)';          // CMYK 20,100,100,0 USGS Color 96
              else if (grainSize === 'cobble') color = 'rgba(179, 0, 0, 1)';          // CMYK 30,100,100,0 USGS Color 97
              else if (grainSize === 'boulder') color = 'rgba(153, 0, 0, 1)';         // CMYK 40,100,100,0 USGS Color 98
            }
            // Limestone / Dolostone
            else if (grainSize === 'mudstone') color = 'rgba(77, 255, 128, 1)';       // CMYK 70,0,50,0 USGS Color 860
            else if (grainSize === 'wackestone') color = 'rgba(77, 255, 179, 1)';     // CMYK 70,0,30,0 USGS Color 840
            else if (grainSize === 'packstone') color = 'rgba(77, 255, 222, 1)';      // CMYK 70,0,13,0 USGS Color 820
            else if (grainSize === 'grainstone') color = 'rgba(179, 255, 255, 1)';    // CMYK 30,0,0,0 USGS Color 400
            else if (grainSize === 'boundstone') color = 'rgba(77, 128, 255, 1)';     // CMYK 70,50,0,0 USGS Color 806
            else if (grainSize === 'cementstone') color = 'rgba(0, 179, 179, 1)';     // CMYK 100,30,30,0 USGS Color 944
            else if (grainSize === 'recrystallized') color = 'rgba(0, 102, 222, 1)';  // CMYK 100,60,13,0 USGS Color 927
            else if (grainSize === 'floatstone') color = 'rgba(77, 255, 255, 1)';     // CMYK 70,0,0,0 USGS Color 800
            else if (grainSize === 'rudstone') color = 'rgba(77, 204, 255, 1)';       // CMYK 70,20,0,0 USGS Color 803
            else if (grainSize === 'framestone') color = 'rgba(77, 128, 255, 1)';     // CMYK 70,50,0,0 USGS Color 806
            else if (grainSize === 'bafflestone') color = 'rgba(77, 128, 255, 1)';    // CMYK 70,50,0,0 USGS Color 806
            else if (grainSize === 'bindstone') color = 'rgba(77, 128, 255, 1)';      // CMYK 70,50,0,0 USGS Color 806
            // Misc. Lithologies
            else if (grainSize === 'evaporite') color = 'rgba(153, 77, 255, 1)';      // CMYK 40,70,0,0 USGS Color 508
            else if (grainSize === 'chert') color = 'rgba(102, 77, 77, 1)';           // CMYK 60,70,70,0
            else if (grainSize === 'ironstone') color = 'rgba(153, 0, 0, 1)';         // CMYK 40,100,100,0
            else if (grainSize === 'phosphatic') color = 'rgba(153, 255, 179, 1)';    // CMYK 40,0,30,0
            else if (grainSize === 'volcaniclastic') color = 'rgba(255, 128, 255, 1)';// CMYK 0,50,0,0
            else if (grainSize === 'organic_coal') color = 'rgba(0, 0, 0, 1)';        // CMYK 100,100,100,0 USGS Color 999
          }
        }
      }
    }
    if (fill) {
      return {
        fillPattern: fill,
      };
    }
    else if (color) {
      return {
        fillColor: color,
      };
    }
  };

  return {
    getStratIntervalFill,
  };
};

export default useStratSectionSymbology;
