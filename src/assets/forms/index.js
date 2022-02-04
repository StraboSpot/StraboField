import faultRock from './fabrics/fault-rock.json';
import igneousRock from './fabrics/igneous-rock.json';
import metamorphicRock from './fabrics/metamorphic-rock.json';
import geography from './geography.json';
import imageProperties from './image-properties.json';
import linearOrientation from './measurement/linear-orientation.json';
import planarOrientation from './measurement/planar-orientation.json';
import tabularZoneOrientation from './measurement/tabular-zone-orientation.json';
import namingConventions from './naming-conventions.json';
import rockTypeAlterationOreDeprecated from './pet/deprecated/rock-type-alteration-ore.json';
import rockTypeIgneousDeprecated from './pet/deprecated/rock-type-igneous.json';
import rockTypeMetamorphicDeprecated from './pet/deprecated/rock-type-metamorphic.json';
import minerals from './pet/minerals.json';
import reactionTextures from './pet/reaction-textures.json';
import rockTypeAlterationOre from './pet/rock-type-alteration-ore.json';
import rockTypePlutonic from './pet/rock-type-igneous-plutonic.json';
import rockTypeVolcanic from './pet/rock-type-igneous-volcanic.json';
import rockTypeMetamorphic from './pet/rock-type-metamorphic.json';
import projectDescription from './project-description.json';
import sample from './sample.json';
import sedBeddingSharedInterbedded from './sed/bedding-shared-interbedded.json';
import sedBeddingSharedPackage from './sed/bedding-shared-package.json';
import sedBedding from './sed/bedding.json';
import sedDiagenesis from './sed/diagenesis.json';
import sedFossils from './sed/fossils.json';
import sedInterpretationsArchitecture from './sed/interpretations-architecture.json';
import sedInterpretationsEnvironment from './sed/interpretations-environment.json';
import sedInterpretationsProcess from './sed/interpretations-process.json';
import sedInterpretationsSurfaces from './sed/interpretations-surfaces.json';
import sedInterval from './sed/interval.json';
import sedLithologiesComposition from './sed/lithologies-composition.json';
import sedLithologiesLithology from './sed/lithologies-lithology.json';
import sedLithologiesStratification from './sed/lithologies-stratification.json';
import sedLithologiesTexture from './sed/lithologies-texture.json';
import sedStratSection from './sed/strat-section.json';
import sedStructuresBeddingPlane from './sed/structures-bedding-plane.json';
import sedStructuresBioturbation from './sed/structures-bioturbation.json';
import sedStructuresPedogenic from './sed/structures-pedogenic.json';
import sedStructuresPhysical from './sed/structures-physical.json';
import surfaceFeature from './surface-feature.json';
import tags from './tags.json';
import fabric from './three-d-structures/fabric.json';
import fold from './three-d-structures/fold.json';
import other from './three-d-structures/other.json';
import tensor from './three-d-structures/tensor.json';
import trace from './trace.json';
import userProfile from './user-profile.json';

const getMeasurementSurveyForBulkInput = (form) => {
  const fieldsToExclude = ['label', 'strike', 'dip_direction', 'dip', 'trend', 'plunge', 'rake', 'rake_calculated'];
  return form.filter(field => !fieldsToExclude.includes(field.name));
};

// Modify Sed Lithology form to use in Sed Rocks page
const getSedimentaryRockForm = () => {
  const modifiedSurvey = sedLithologiesLithology.survey.map(f => {
    if (f.name === 'group_dh9oi63') return {...f, label: 'Sedimentary Rock'};
    else if (f.name === 'primary_lithology') return {...f, label: 'Sedimentary Rock Type'};
    else return f;
  });
  return {...sedLithologiesLithology, survey: modifiedSurvey};
};

const forms = {
  _3d_structures: {
    other: other,
    fold: fold,
    fabric: fabric,
    tensor: tensor,
  },
  fabrics: {
    fault_rock: faultRock,
    igneous_rock: igneousRock,
    metamorphic_rock: metamorphicRock,
  },
  general: {
    geography: geography,
    images: imageProperties,
    project_description: projectDescription,
    trace: trace,
    samples: sample,
    surface_feature: surfaceFeature,
    user_profile: userProfile,
  },
  measurement: {
    linear_orientation: linearOrientation,
    planar_orientation: planarOrientation,
    tabular_orientation: tabularZoneOrientation,
  },
  measurement_bulk: {
    linear_orientation: {
      survey: getMeasurementSurveyForBulkInput(linearOrientation.survey),
      choices: linearOrientation.choices,
    },
    planar_orientation: {
      survey: getMeasurementSurveyForBulkInput(planarOrientation.survey),
      choices: planarOrientation.choices,
    },
    tabular_orientation: {
      survey: getMeasurementSurveyForBulkInput(tabularZoneOrientation.survey),
      choices: tabularZoneOrientation.choices,
    },
  },
  pet: {
    alteration_or: rockTypeAlterationOre,
    metamorphic: rockTypeMetamorphic,
    minerals: minerals,
    plutonic: rockTypePlutonic,
    reactions: reactionTextures,
    volcanic: rockTypeVolcanic,
  },
  pet_deprecated: {
    alteration_or: rockTypeAlterationOreDeprecated,
    igneous: rockTypeIgneousDeprecated,
    metamorphic: rockTypeMetamorphicDeprecated,
  },
  preferences: {
    naming_conventions: namingConventions,
  },
  project: {
    tags: tags,
  },
  sed: {
    architecture: sedInterpretationsArchitecture,
    bedding: sedBedding,
    bedding_plane: sedStructuresBeddingPlane,
    bedding_shared_interbedded: sedBeddingSharedInterbedded,
    bedding_shared_package: sedBeddingSharedPackage,
    bioturbation: sedStructuresBioturbation,
    composition: sedLithologiesComposition,
    diagenesis: sedDiagenesis,
    environment: sedInterpretationsEnvironment,
    fossils: sedFossils,
    interval: sedInterval,
    lithologies: getSedimentaryRockForm(),
    lithology: sedLithologiesLithology,
    pedogenic: sedStructuresPedogenic,
    physical: sedStructuresPhysical,
    process: sedInterpretationsProcess,
    strat_section: sedStratSection,
    stratification: sedLithologiesStratification,
    surfaces: sedInterpretationsSurfaces,
    texture: sedLithologiesTexture,
  },
};

export default forms;
