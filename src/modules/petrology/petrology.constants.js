import {PAGE_KEYS} from '../page/pageKeys.constants';

export const IGNEOUS_ROCK_CLASSES = {PLUTONIC: 'plutonic', VOLCANIC: 'volcanic'};

export const ADD_ROCK_KEYS = {
  alteration_ore: {
    firstKeys: ['ore_type'],
    secondKeys: ['hydrothermal_alteration'],
    lastKeys: ['alteration_host_rock', 'mineralized_elements', 'notes_ore'],
  },
  fault: {
    firstKeys: ['fault_rock'],
    lastKeys: ['interp_note'],
  },
  igneous: {
    plutonic: {
      firstKeys: ['plutonic_rock_type'],
      mainButtonsKeys: ['occurence_plutonic', 'texture_plutonic', 'color_index_pluton', 'alteration_plutonic'],
      lastKeys: ['pluton_characteristic_size_of', 'notes_plutonic'],
    },
    volcanic: {
      firstKeys: ['volcanic_rock_type'],
      mainButtonsKeys: ['occurence_volcanic', 'texture_volcanic', 'color_index_volc', 'alteration_volcanic'],
      lastKeys: ['vol_characteristic_size_of_cry', 'notes_volcanic'],
    },
  },
  metamorphic: {
    firstKeys: ['metamorphic_rock_type'],
    secondKeys: ['protolith'],
    thirdKeys: ['facies'],
    fourthKeys: ['zone'],
    lastKeys: ['notes_metamorphic'],
  },
  mineral: {
    firstKeys: ['mineral_abbrev', 'full_mineral_name'],
    igOrMetKey: 'igneous_or_metamorphic',
    igButtonsKeys: ['habit', 'textural_setting_igneous'],
    metButtonsKeys: ['habit_met', 'textural_setting_metamorphic'],
    lastKeys: ['average_grain_size_mm', 'maximum_grain_size_mm', 'modal', 'mineral_notes'],
  },
  reaction: {
    firstKeys: ['reactions'],
    basedOnKey: 'based_on',
    basedOnOtherKey: 'other_based_on',
    lastKeys: ['notes'],
  },
  sedimentary: {
    firstKeys: ['primary_lithology'],
    siliciclasticKeys: ['siliciclastic_type'],
    dunhamKeys: ['dunham_classification', 'grain_type'],
    evaporiteKeys: ['evaporite_type'],
    organicCoalKeys: ['organic_coal_lithologies'],
    volcaniclasticKeys: ['volcaniclastic_type'],
    phosphoriteKeys: ['phosphorite_type'],
    weatheringKey: 'relative_resistance_weather',
    thirdKeys: ['lithification', 'color_appearance'],
    lastKeys: ['fresh_color', 'weathered_color', 'notes'],
  },
};

export const ALTERATION_ORE_SECTION_TITLE = {
  [PAGE_KEYS.ROCK_TYPE_ALTERATION_ORE]: 'Alteration, Ore Rocks',
  deprecated: 'Alteration, Ore Rocks (Deprecated Version)',
};

export const FAULT_SECTION_TITLE = {
  [PAGE_KEYS.ROCK_TYPE_FAULT]: 'Fault & Shear Zone Rocks',
};

export const IGNEOUS_SECTION_TITLES = {
  plutonic: 'Plutonic Rocks',
  volcanic: 'Volcanic Rocks',
  deprecated: 'Igneous Rocks (Deprecated Version)',
};

export const METAMORPHIC_SECTION_TITLE = {
  [PAGE_KEYS.ROCK_TYPE_METAMORPHIC]: 'Metamorphic Rocks',
  deprecated: 'Metamorphic Rocks (Deprecated Version)',
};

export const SEDIMENTARY_SECTION_TITLE = {
  [PAGE_KEYS.LITHOLOGIES]: 'Sedimentary Rocks',
};

export const ROCK_FIRST_ORDER_CLASS_FIELDS = {
  igneous: ['plutonic_rock_type', 'volcanic_rock_type'],
  metamorphic: ['metamorphic_rock_type'],
  alteration_or: ['ore_type'],
  fault: ['fault_rock'],
};
