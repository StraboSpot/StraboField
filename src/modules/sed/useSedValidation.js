import {isEmpty} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import {useForm} from '../form';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {useSpots} from '../spots';

const useSedValidation = () => {
  /* Data Hooks */

  const {getLabel} = useForm();
  const {getSpotWithThisStratSection, isStratInterval} = useSpots();

  /* Internal Functions */

  // Get the default units which is the same as the units for the section that this Spot is in
  const getDefaultUnits = (spot) => {
    if (spot.properties && spot.properties.strat_section_id) {
      const spotWithThisStratSection = getSpotWithThisStratSection(spot.properties.strat_section_id);
      if (spotWithThisStratSection && spotWithThisStratSection.properties && spotWithThisStratSection.properties.sed
        && spotWithThisStratSection.properties.sed.strat_section.column_y_axis_units) {
        return spotWithThisStratSection.properties.sed.strat_section.column_y_axis_units;
      }
    }
    return undefined;
  };

  /* Exported Functions */

  const getBasicLithologyIndex = (lithology) => {
    if (lithology.primary_lithology === 'organic_coal') return 1;
    else if (lithology.mud_silt_grain_size) return 2;
    else if (lithology.sand_grain_size) return 3;
    else if (lithology.congl_grain_size || lithology.breccia_grain_size) return 4;
    else if (lithology.dunham_classification) return 5;
    return 0;
  };

  const getSiliciclasticGrainSize = (lithology) => {
    switch (lithology.siliciclastic_type) {
      case 'sandstone':
        return lithology.sand_grain_size;
      case 'conglomerate':
        return lithology.congl_grain_size;
      case 'breccia':
        return lithology.breccia_grain_size;
      case 'claystone':
      case 'mudstone':
      case 'shale':
      case 'siltstone':
        return lithology.mud_silt_grain_size;
      default:
        return undefined;
    }
  };

  const validateSedData = (sed, spot, pageKey) => {
    let errorMessages = [];
    const isMappedInterval = isStratInterval(spot);

    // Validation checks for Bedding page
    const validateBeddingPage = () => {
      const units = getDefaultUnits(spot);
      if (sed.bedding?.package_thickness_units && units !== sed.bedding.package_thickness_units) {
        errorMessages.push('- Package Thickness Units must be ' + units + ' since ' + units
          + ' have been assigned for this strat section.');
      }
      if (sed.bedding?.beds?.length > 0) {
        sed.bedding.beds.forEach((bed, n) => {
          if (sed.bedding.beds[n] && sed.bedding.beds[n].interbed_thickness_units
            && units !== sed.bedding.beds[n].interbed_thickness_units) {
            errorMessages.push('- Thickness Units must be ' + units + ' for bed ' + (n + 1) + ' since ' + units
              + ' have been assigned for the properties of this strat section.');
          }
        });
      }
      if (isMappedInterval && (sed.character === 'interbedded' || sed.character === 'bed_mixed_lit')) {
        if (sed.bedding && sed.bedding.beds) {
          if (!sed.bedding.interbed_proportion) {
            errorMessages.push('- ' + getLabel('interbed_proportion', ['sed', 'bedding']) + ' must be specified.');
          }
          if (!sed.bedding.interbed_proportion_change) {
            errorMessages.push('- ' + getLabel('interbed_proportion_change', ['sed', 'bedding'])
              + ' must be specified.');
          }
          if (sed.bedding.interbed_proportion_change === 'increase'
            || sed.bedding.interbed_proportion_change === 'decrease' && sed.bedding.beds.length > 0) {
            sed.bedding.beds.forEach((bed, n) => {
              if (!(sed.bedding.beds[n].max_thickness && sed.bedding.beds[n].min_thickness)) {
                errorMessages.push('- Both ' + getLabel('max_thickness', ['sed', 'bedding']) + ' and '
                  + getLabel('min_thickness', ['sed', 'bedding']) + ' must be specified for bed ' + (n + 1) + '.');
              }
            });
          }
          else if (sed.bedding.interbed_proportion_change === 'no_change' && sed.bedding.beds.length > 0) {
            sed.bedding.beds.forEach((bed, n) => {
              if (!sed.bedding.beds[n].avg_thickness) {
                errorMessages.push('- ' + getLabel('avg_thickness', ['sed', 'bedding']) + ' must be specified for bed '
                  + (n + 1) + '.');
              }
            });
          }
        }
      }
    };

    // Validation checks for Interval page
    const validateIntervalPage = () => {
      if (isMappedInterval && (isEmpty(sed.interval) || !sed.interval.interval_thickness)) {
        errorMessages.push('Interval Thickness: Required');
      }
      const units = getDefaultUnits(spot);
      if (units !== sed.interval.thickness_units) {
        errorMessages.push('Thickness Units: Must be ' + units + ' since ' + units
          + ' have been assigned for this strat section.');
      }
    };

    // Validation checks for Lithologies page
    const validateLithologiesPage = () => {
      if (isMappedInterval && (sed.character === 'bed' || sed.character === 'bed_mixed_lit'
        || sed.character === 'interbedded' || sed.character === 'package_succe')) {
        if (!isEmpty(sed.lithologies) && sed.lithologies.length > 0) {
          sed.lithologies.forEach((lithology, n) => {
            if (!lithology.primary_lithology) {
              errorMessages.push('Primary Lithology: Required for lithology ' + (n + 1));
            }
            if (lithology.primary_lithology === 'siliciclastic' && !getSiliciclasticGrainSize(lithology)) {
              errorMessages.push(
                'Grain Size: Required for lithology ' + (n + 1) + ' if the primary lithology is siliciclastic.');
            }
            if ((lithology.primary_lithology === 'limestone' || lithology.primary_lithology === 'dolostone')
              && !lithology.dunham_classification) {
              errorMessages.push('Dunham Classification: Required for lithology ' + (n + 1) + ' if the primary '
                + 'lithology is limestone or dolostone.');
            }
          });
        }
        else {
          errorMessages.push('Lithologies: Required for ' + getLabel(sed.character, ['sed', 'interval'])
            + ' interval.');
        }
      }
    };

    if (pageKey === PAGE_KEYS.INTERVAL) validateIntervalPage();
    else if (pageKey === PAGE_KEYS.LITHOLOGIES) validateLithologiesPage();
    else if (pageKey === PAGE_KEYS.BEDDING) validateBeddingPage();

    if (isEmpty(errorMessages)) return true;
    else {
      alert('Error Saving', 'Errors found in following fields. Unable to save these changes.'
        + ' Please fix the following errors.\n\n' + errorMessages.join('\n'));
      throw Error('Sed Validation Error');
    }
  };

  return {
    getBasicLithologyIndex,
    getSiliciclasticGrainSize,
    validateSedData,
  };
};

export default useSedValidation;
