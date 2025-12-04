import BasicOverviewList from './BasicOverviewList';
import Overview from './Overview';
import DailyNotesModal from '../daily-notes/DailyNotesModal';
import DataOverview from '../external-data/DataOverview';
import ExternalData from '../external-data/ExternalData';
import AddFabricModal from '../fabrics/AddFabricModal';
import FabricsOverview from '../fabrics/FabricsOverview';
import FabricsPage from '../fabrics/FabricsPage';
import Geography from '../geography/Geography';
import AddEarthquakeModal from '../geomorph/AddEarthquakeModal';
import EarthquakesPage from '../geomorph/EarthquakesPage';
import ImagesOverview from '../images/ImagesOverview'; // import {ImagesOverview, ImagesViewPage} from '../images'; errors in web
import ImagesPage from '../images/ImagesPage';
import AddIntervalModal from '../maps/strat-section/AddIntervalModal';
import AddMeasurementModal from '../measurements/AddMeasurementModal';
import MeasurementsOverview from '../measurements/MeasurementsOverview';
import MeasurementsPage from '../measurements/MeasurementsPage';
import Metadata from '../metadata/Metadata';
import Nesting from '../nesting/Nesting';
import NotesPage from '../notes/Notes';
import NotesOverview from '../notes/NotesOverview';
import ShortcutNotesModal from '../notes/ShortcutNotesModal';
import OtherFeaturesOverview from '../other-features/OtherFeaturesOverview';
import OtherFeaturesPage from '../other-features/OtherFeaturesPage';
import AddMineralModal from '../petrology/AddMineralModal';
import AddReactionTextureModal from '../petrology/AddReactionTextureModal';
import AddRockModal from '../petrology/AddRockModal';
import MineralsPage from '../petrology/MineralsPage';
import ReactionTexturesPage from '../petrology/ReactionTexturesPage';
import RockAlterationOrePage from '../petrology/RockAlterationOrePage';
import RockFaultPage from '../petrology/RockFaultPage';
import RockIgneousPage from '../petrology/RockIgneousPage';
import RockMetamorphicPage from '../petrology/RockMetamorphicPage';
import RockSedimentaryPage from '../petrology/RockSedimentaryPage';
import TernaryPage from '../petrology/TernaryPage';
import {ReportModal, ReportsListModal, ReportsPage} from '../reports';
import SampleModal from '../samples/SampleModal';
import SamplesOverview from '../samples/SamplesOverview';
import SamplesPage from '../samples/SamplesPage';
import BasicSedPage from '../sed/BasicSedPage';
import BeddingPage from '../sed/BeddingPage';
import IntervalOverview from '../sed/IntervalOverview';
import IntervalPage from '../sed/IntervalPage';
import StratSectionPage from '../sed/StratSectionPage';
import SiteSafetyPage from '../site-safety/SiteSafetyPage';
import SpotsRawDataView from '../spots/SpotsRawDataView';
import {
  AddTagsToSpotsShortcutModal,
  FeatureTagsModal,
  TagsAtSpotList,
  TagsNotebook,
  TagsNotebookModal,
  TagsShortcutModal,
} from '../tags';
import AddTephraModal from '../tephra/AddTephraModal';
import TephraPage from '../tephra/TephraPage';
import AddThreeDStructureModal from '../three-d-structures/AddThreeDStructureModal';
import ThreeDStructuresOverview from '../three-d-structures/ThreeDStructuresOverview';
import ThreeDStructuresPage from '../three-d-structures/ThreeDStructuresPage';

// Called in Dialog.js

export const PAGE_KEYS = {
  BEDDING: 'bedding',
  DATA: 'data',
  DIAGENESIS: 'diagenesis',
  EARTHQUAKES: 'earthquakes',
  FABRICS: 'fabrics',
  FOSSILS: 'fossils',
  GEOGRAPHY: 'geography',
  GEOLOGIC_UNITS: 'geologic_unit',
  IMAGES: 'images',
  INTERPRETATIONS: 'interpretations',
  INTERVAL: 'interval',
  LITHOLOGIES: 'lithologies',
  MEASUREMENTS: 'orientation_data',
  METADATA: 'metadata',
  MINERALS: 'minerals',
  NESTING: 'nesting',
  NOTES: 'notes',
  OTHER_FEATURES: 'other_features',
  OVERVIEW: 'overview',
  REACTIONS: 'reactions',
  REPORTS: 'reports',
  ROCK_TYPE_ALTERATION_ORE: 'alteration_or',
  ROCK_TYPE_FAULT: 'fault',
  ROCK_TYPE_IGNEOUS: 'igneous',
  ROCK_TYPE_METAMORPHIC: 'metamorphic',
  ROCK_TYPE_SEDIMENTARY: 'sedimentary',
  SAMPLES: 'samples',
  SITE_SAFETY: 'site_safety',
  STRAT_SECTION: 'strat_section',
  STRUCTURES: 'structures',
  TAGS: 'tags',
  TEPHRA: 'tephra',
  TERNARY: 'ternary',
  THREE_D_STRUCTURES: '_3d_structures',
};

console.log('PAGE_KEYS', PAGE_KEYS);

export const OVERVIEW_PAGE = {
  key: PAGE_KEYS.OVERVIEW,
  label: 'Overview',
  page_component: Overview,
};

export const PRIMARY_PAGES = [
  {
    key: PAGE_KEYS.GEOLOGIC_UNITS,
    label: 'Geologic Units',
    icon_src: require('../../assets/icons/GeologicUnit.png'),
    icon_pressed_src: require('../../assets/icons/GeologicUnit_pressed.png'),
    overview_component: TagsAtSpotList,
    page_component: TagsNotebook,
    modal_component: TagsNotebookModal,
    action_label: 'Add Geologic Units',
  }, {
    key: PAGE_KEYS.NOTES,
    label: 'Notes',
    icon_src: require('../../assets/icons/Notes.png'),
    icon_pressed_src: require('../../assets/icons/Notes_pressed.png'),
    overview_component: NotesOverview,
    page_component: NotesPage,
  }, {
    key: PAGE_KEYS.MEASUREMENTS,
    label: 'Measurements',
    icon_src: require('../../assets/icons/Measurement.png'),
    icon_pressed_src: require('../../assets/icons/Measurement_pressed.png'),
    overview_component: MeasurementsOverview,
    page_component: MeasurementsPage,
    modal_component: AddMeasurementModal,
    action_label: 'Take a Measurement',
  }, {
    key: PAGE_KEYS.IMAGES,
    label: 'Images',
    icon_src: require('../../assets/icons/Photo.png'),
    icon_pressed_src: require('../../assets/icons/Photo_pressed.png'),
    overview_component: ImagesOverview,
    page_component: ImagesPage,
  }, {
    key: PAGE_KEYS.TAGS,
    label: 'Tags',
    icon_src: require('../../assets/icons/Tag.png'),
    icon_pressed_src: require('../../assets/icons/Tag_pressed.png'),
    overview_component: TagsAtSpotList,
    page_component: TagsNotebook,
    modal_component: TagsNotebookModal,
    action_label: 'Add Spot Tags',
  }, {
    key: PAGE_KEYS.SAMPLES,
    label: 'Samples',
    icon_src: require('../../assets/icons/Sample.png'),
    icon_pressed_src: require('../../assets/icons/Sample_pressed.png'),
    overview_component: SamplesOverview,
    page_component: SamplesPage,
    modal_component: SampleModal,
    action_label: 'Add a Sample',
  }, {
    key: PAGE_KEYS.REPORTS,
    label: 'Reports',
    icon_src: require('../../assets/icons/Reports.png'),
    icon_pressed_src: require('../../assets/icons/Reports_pressed.png'),
    page_component: ReportsPage,
    modal_component: ReportModal,
    action_label: 'Create New Report',
  },
];

export const SECONDARY_PAGES = [
  {
    key: PAGE_KEYS.THREE_D_STRUCTURES,
    label: '3D Structures',
    label_singular: '3D Structure',
    icon_src: require('../../assets/icons/3DStructure.png'),
    icon_pressed_src: require('../../assets/icons/3DStructure_pressed.png'),
    overview_component: ThreeDStructuresOverview,
    page_component: ThreeDStructuresPage,
    modal_component: AddThreeDStructureModal,
    action_label: 'Add a 3D Structure',
  }, {
    key: PAGE_KEYS.FABRICS,
    label: 'Fabrics',
    icon_src: require('../../assets/icons/Fabric.png'),
    icon_pressed_src: require('../../assets/icons/Fabric_pressed.png'),
    overview_component: FabricsOverview,
    page_component: FabricsPage,
    modal_component: AddFabricModal,
    action_label: 'Add a Fabric',
    testing: true,
  }, {
    key: PAGE_KEYS.OTHER_FEATURES,
    label: 'Other Features',
    icon_src: require('../../assets/icons/OtherFeatures.png'),
    icon_pressed_src: require('../../assets/icons/OtherFeatures_pressed.png'),
    overview_component: OtherFeaturesOverview,
    page_component: OtherFeaturesPage,
  }, {
    key: PAGE_KEYS.DATA,
    label: 'Data',
    label_singular: 'Data',
    icon_src: require('../../assets/icons/Data.png'),
    icon_pressed_src: require('../../assets/icons/Data_pressed.png'),
    page_component: ExternalData,
    overview_component: DataOverview,
  }, {
    key: PAGE_KEYS.SITE_SAFETY,
    label: 'Site Safety Summary',
    icon_src: require('../../assets/icons/SiteSafety.png'),
    icon_pressed_src: require('../../assets/icons/SiteSafety_pressed.png'),
    page_component: SiteSafetyPage,
  }, {
    key: PAGE_KEYS.TEPHRA,
    label: 'Tephra Layers',
    icon_src: require('../../assets/icons/Tephra.png'),
    icon_pressed_src: require('../../assets/icons/Tephra_pressed.png'),
    page_component: TephraPage,
    modal_component: AddTephraModal,
    overview_component: BasicOverviewList,
    action_label: 'Add a Tephra Layer',
    testing: true,
  }, {
    key: PAGE_KEYS.EARTHQUAKES,
    label: 'Earthquakes',
    icon_src: require('../../assets/icons/Earthquake.png'),
    icon_pressed_src: require('../../assets/icons/Earthquake_pressed.png'),
    page_component: EarthquakesPage,
    modal_component: AddEarthquakeModal,
    overview_component: BasicOverviewList,
    action_label: 'Add an Earthquake Feature',
  },
];

export const SUBPAGES = [
  {
    key: PAGE_KEYS.GEOGRAPHY,
    label: 'Geography',
    page_component: Geography,
  }, {
    key: PAGE_KEYS.NESTING,
    label: 'Nesting',
    page_component: Nesting,
  }, {
    key: PAGE_KEYS.METADATA,
    label: 'Metadata',
    page_component: Metadata,
  },
];

export const PET_PAGES = [
  {
    key: PAGE_KEYS.ROCK_TYPE_ALTERATION_ORE,
    label: 'Alteration, Ore Rocks',
    icon_src: require('../../assets/icons/Economic.png'),
    icon_pressed_src: require('../../assets/icons/Economic_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: RockAlterationOrePage,
    modal_component: AddRockModal,
    action_label: 'Add an Alteration, Ore Rock',
  }, {
    key: PAGE_KEYS.ROCK_TYPE_FAULT,
    label: 'Fault & Shear Zone Rocks',
    icon_src: require('../../assets/icons/FaultRock.png'),
    icon_pressed_src: require('../../assets/icons/FaultRock_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: RockFaultPage,
    modal_component: AddRockModal,
    action_label: 'Add a Fault or Shear Zone Rock',
  }, {
    key: PAGE_KEYS.ROCK_TYPE_IGNEOUS,
    label: 'Igneous Rocks',
    icon_src: require('../../assets/icons/Igneous.png'),
    icon_pressed_src: require('../../assets/icons/Igneous_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: RockIgneousPage,
    modal_component: AddRockModal,
    action_label: 'Add an Igneous Rock',
  }, {
    key: PAGE_KEYS.ROCK_TYPE_METAMORPHIC,
    label: 'Metamorphic Rocks',
    icon_src: require('../../assets/icons/Metamorphic.png'),
    icon_pressed_src: require('../../assets/icons/Metamorphic_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: RockMetamorphicPage,
    modal_component: AddRockModal,
    action_label: 'Add a Metamorphic Rock',
  }, {
    key: PAGE_KEYS.MINERALS,
    label: 'Minerals',
    icon_src: require('../../assets/icons/Minerals.png'),
    icon_pressed_src: require('../../assets/icons/Minerals_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: MineralsPage,
    modal_component: AddMineralModal,
    action_label: 'Add Mineral Data',
  }, {
    key: PAGE_KEYS.REACTIONS,
    label: 'Reaction Textures',
    icon_src: require('../../assets/icons/Reactions.png'),
    icon_pressed_src: require('../../assets/icons/Reactions_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: ReactionTexturesPage,
    modal_component: AddReactionTextureModal,
    action_label: 'Add a Reaction Texture',
    testing: true,
  }, {
    key: PAGE_KEYS.TERNARY,
    label: 'Ternary',
    label_singular: 'Ternary',
    icon_src: require('../../assets/icons/Ternary.png'),
    icon_pressed_src: require('../../assets/icons/Ternary_pressed.png'),
    page_component: TernaryPage,
    testing: true,
  },
];

export const SED_PAGES = [
  {
    key: PAGE_KEYS.ROCK_TYPE_SEDIMENTARY,
    label: 'Sedimentary Rocks',
    icon_src: require('../../assets/icons/Sedimentary.png'),
    icon_pressed_src: require('../../assets/icons/Sedimentary_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: RockSedimentaryPage,
    modal_component: AddRockModal,
    action_label: 'Add a Sedimentary Rock',
  }, {
    key: PAGE_KEYS.STRAT_SECTION,
    label: 'Strat Section',
    label_singular: 'Strat Section',
    icon_src: require('../../assets/icons/SedStratColumn.png'),
    icon_pressed_src: require('../../assets/icons/SedStratColumn_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: StratSectionPage,
  }, {
    key: PAGE_KEYS.INTERVAL,
    label: 'Interval',
    label_singular: 'Interval',
    icon_src: require('../../assets/icons/SedInterval.png'),
    icon_pressed_src: require('../../assets/icons/SedInterval_pressed.png'),
    overview_component: IntervalOverview,
    page_component: IntervalPage,
  }, {
    key: PAGE_KEYS.LITHOLOGIES,
    label: 'Lithologies',
    label_singular: 'Lithology',
    icon_src: require('../../assets/icons/SedLithologies.png'),
    icon_pressed_src: require('../../assets/icons/SedLithologies_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: BasicSedPage,
  }, {
    key: PAGE_KEYS.BEDDING,
    label: 'Bedding',
    label_singular: 'Bedding',
    icon_src: require('../../assets/icons/SedBedding.png'),
    icon_pressed_src: require('../../assets/icons/SedBedding_pressed.png'),
    page_component: BeddingPage,
    overview_component: BasicOverviewList,
  }, {
    key: PAGE_KEYS.STRUCTURES,
    label: 'Structures',
    label_singular: 'Structure',
    icon_src: require('../../assets/icons/SedStructure.png'),
    icon_pressed_src: require('../../assets/icons/SedStructure_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: BasicSedPage,
  }, {
    key: PAGE_KEYS.DIAGENESIS,
    label: 'Diagenesis',
    label_singular: 'Diagenesis',
    icon_src: require('../../assets/icons/SedDiagenesis.png'),
    icon_pressed_src: require('../../assets/icons/SedDiagenesis_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: BasicSedPage,
  }, {
    key: PAGE_KEYS.FOSSILS,
    label: 'Fossils',
    label_singular: 'Fossil',
    icon_src: require('../../assets/icons/SedFossil.png'),
    icon_pressed_src: require('../../assets/icons/SedFossil_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: BasicSedPage,
  }, {
    key: PAGE_KEYS.INTERPRETATIONS,
    label: 'Interpretations',
    label_singular: 'Interpretation',
    icon_src: require('../../assets/icons/SedInterpretation.png'),
    icon_pressed_src: require('../../assets/icons/SedInterpretation_pressed.png'),
    overview_component: BasicOverviewList,
    page_component: BasicSedPage,
  },
];

export const NOTEBOOK_PAGES = [OVERVIEW_PAGE, ...PRIMARY_PAGES, ...SECONDARY_PAGES, ...SUBPAGES, ...PET_PAGES, ...SED_PAGES];

export const MODAL_KEYS = {
  // Get the notebook modal keys from the notebook constants
  NOTEBOOK: NOTEBOOK_PAGES.reduce((acc, p) => {
    const key = Object.keys(PAGE_KEYS).find(k => PAGE_KEYS[k] === p.key);
    return p.modal_component ? {...acc, [key]: p.key} : acc;
  }, {}),
  SHORTCUTS: {
    GEOLOGIC_UNITS: 'geologic_units',
    MEASUREMENT: 'measurement',
    SAMPLE: 'sample',
    NOTE: 'note',
    TAG: 'tag',
    SKETCH: 'sketch',
    PHOTO: 'photo',
  },
  OTHER: {
    ADD_INTERVAL: 'add_interval',
    ADD_SPOTS_TO_REPORTS: 'AddSpotsToReports',
    ADD_SPOTS_TO_QAQC: 'AddSpotsToQAQC',
    ADD_TAGS_TO_SPOTS: 'AddTagsToSpots',
    DAILY_NOTES: 'daily_setup',
    FEATURE_TAGS: 'FeatureTags',
    GEOLOGIC_UNITS: 'geologic_unit',
  },
};

export const NOTEBOOK_MODELS = NOTEBOOK_PAGES.reduce((acc, p) => p.modal_component ? [...acc, p] : acc, []);

export const SHORTCUT_MODALS = [
  {
    key: MODAL_KEYS.SHORTCUTS.GEOLOGIC_UNITS,
    label: 'Geologic Units',
    action_label: 'Shortcut Mode: \nAdd Geologic Unit',
    icon_src: require('../../assets/icons/GeologicUnitButtonShortcut.png'),
    icon_pressed_src: require('../../assets/icons/GeologicUnitButtonShortcut_pressed.png'),
    modal_component: TagsShortcutModal,
    notebook_modal_key: MODAL_KEYS.NOTEBOOK.GEOLOGIC_UNITS,
  }, {
    key: MODAL_KEYS.SHORTCUTS.TAG,
    label: 'Tag',
    action_label: 'Shortcut Mode: \nAdd Tags',
    icon_src: require('../../assets/icons/TagButtonShortcut.png'),
    icon_pressed_src: require('../../assets/icons/TagButtonShortcut_pressed.png'),
    modal_component: TagsShortcutModal,
    notebook_modal_key: MODAL_KEYS.NOTEBOOK.TAGS,
  }, {
    key: MODAL_KEYS.SHORTCUTS.MEASUREMENT,
    label: 'Measurement',
    action_label: 'Shortcut Mode: \nTake a Measurement',
    icon_src: require('../../assets/icons/MeasurementButtonShortcut.png'),
    icon_pressed_src: require('../../assets/icons/MeasurementButtonShortcut_pressed.png'),
    modal_component: AddMeasurementModal,
    notebook_modal_key: MODAL_KEYS.NOTEBOOK.MEASUREMENTS,
  }, {
    key: MODAL_KEYS.SHORTCUTS.SAMPLE,
    label: 'Sample',
    action_label: 'Shortcut Mode: \nAdd a Sample',
    icon_src: require('../../assets/icons/SampleButtonShortcut.png'),
    icon_pressed_src: require('../../assets/icons/SampleButtonShortcut_pressed.png'),
    modal_component: SampleModal,
    notebook_modal_key: MODAL_KEYS.NOTEBOOK.SAMPLES,
  }, {
    key: MODAL_KEYS.SHORTCUTS.NOTE,
    label: 'Note',
    action_label: 'Shortcut Mode: \nAdd a Note',
    icon_src: require('../../assets/icons/NotesButtonShortcut.png'),
    icon_pressed_src: require('../../assets/icons/NotesButtonShortcut_pressed.png'),
    modal_component: ShortcutNotesModal,
    notebook_modal_key: PAGE_KEYS.NOTES,
  }, {
    key: MODAL_KEYS.SHORTCUTS.PHOTO,
    label: 'Photo',
    action_label: 'Add a Photo',
    icon_src: require('../../assets/icons/PhotoButtonShortcut.png'),
    icon_pressed_src: require('../../assets/icons/PhotoButtonShortcut_pressed.png'),
  }, {
    key: MODAL_KEYS.SHORTCUTS.SKETCH,
    label: 'Sketch',
    action_label: 'Add a Sketch',
    icon_src: require('../../assets/icons/SketchButtonShortcut.png'),
    icon_pressed_src: require('../../assets/icons/SketchButtonShortcut_pressed.png'),
  },
];

const OTHER_MODALS = [
  {
    key: MODAL_KEYS.OTHER.ADD_INTERVAL,
    label: 'Add Interval',
    modal_component: AddIntervalModal,
  }, {
    key: MODAL_KEYS.OTHER.ADD_SPOTS_TO_REPORTS,
    label: 'Add Spots To Reports',
    modal_component: ReportsListModal,
  }, {
    key: MODAL_KEYS.OTHER.ADD_SPOTS_TO_QAQC,
    label: 'Add Spots To QAQC',
    modal_component: SpotsRawDataView,
  }, {
    key: MODAL_KEYS.OTHER.ADD_TAGS_TO_SPOTS,
    label: 'Add Tags To Spots',
    modal_component: AddTagsToSpotsShortcutModal,
  }, {
    key: MODAL_KEYS.OTHER.DAILY_NOTES,
    label: 'Daily Notes',
    modal_component: DailyNotesModal,
  }, {
    key: MODAL_KEYS.OTHER.FEATURE_TAGS,
    label: 'Add Feature Tags',
    modal_component: FeatureTagsModal,
  },
];

export const MODALS = [...NOTEBOOK_MODELS, ...SHORTCUT_MODALS, ...OTHER_MODALS];

export const SAMPLES_OVERVIEW_SECTIONS = [PAGE_KEYS.SAMPLES, PAGE_KEYS.NOTES, PAGE_KEYS.IMAGES, PAGE_KEYS.TAGS];

export const PAGES_HIDDEN_IN_SAMPLE = [PAGE_KEYS.SAMPLES, PAGE_KEYS.SITE_SAFETY, PAGE_KEYS.STRAT_SECTION, PAGE_KEYS.INTERVAL, PAGE_KEYS.INTERPRETATIONS];
