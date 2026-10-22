import FeatureOverviewList from './FeatureOverviewList';
import Overview from './Overview';
import {MODAL_KEYS, PAGE_KEYS} from './pageKeys.constants';
import ExternalDataOverview from '../external-data/ExternalDataOverview';
import ExternalDataPage from '../external-data/ExternalDataPage';
import AddFabricModal from '../fabrics/AddFabricModal';
import FabricsOverview from '../fabrics/FabricsOverview';
import FabricsPage from '../fabrics/FabricsPage';
import GeographyPage from '../geography/GeographyPage';
import AddEarthquakeModal from '../geomorph/AddEarthquakeModal';
import EarthquakesPage from '../geomorph/EarthquakesPage';
import ImagesOverview from '../images/ImagesOverview';
import ImagesPage from '../images/ImagesPage';
import AddIntervalModal from '../maps/strat-section/AddIntervalModal';
import AddMeasurementModal from '../measurements/AddMeasurementModal';
import MeasurementsOverview from '../measurements/MeasurementsOverview';
import MeasurementsPage from '../measurements/MeasurementsPage';
import MetadataPage from '../metadata/MetadataPage';
import NestingPage from '../nesting/NestingPage';
import NotesOverview from '../notes/NotesOverview';
import NotesPage from '../notes/NotesPage';
import NotesShortcutModal from '../notes/NotesShortcutModal';
import OtherFeaturesOverview from '../other-features/OtherFeaturesOverview';
import OtherFeaturesPage from '../other-features/OtherFeaturesPage';
import OutcropSummaryPage from '../outcrop-summary/OutcropSummaryPage';
import AddMineralModal from '../petrology/minerals/AddMineralModal';
import MineralsPage from '../petrology/minerals/MineralsPage';
import TernaryPage from '../petrology/minerals/TernaryPage';
import AddReactionTextureModal from '../petrology/reaction-textures/AddReactionTextureModal';
import ReactionTexturesPage from '../petrology/reaction-textures/ReactionTexturesPage';
import AddRockModal from '../petrology/rocks/AddRockModal';
import RockAlterationOrePage from '../petrology/rocks/RockAlterationOrePage';
import RockFaultPage from '../petrology/rocks/RockFaultPage';
import RockIgneousPage from '../petrology/rocks/RockIgneousPage';
import RockMetamorphicPage from '../petrology/rocks/RockMetamorphicPage';
import RockSedimentaryPage from '../petrology/rocks/RockSedimentaryPage';
import QAQCOverview from '../qaqc/QAQCOverview';
import QAQCPage from '../qaqc/QAQCPage';
import ReportModal from '../reports/ReportModal';
import ReportsListModal from '../reports/ReportsListModal';
import ReportsOverview from '../reports/ReportsOverview';
import ReportsPage from '../reports/ReportsPage';
import IGSNPage from '../samples/igsn/IGSNPage';
import SampleModal from '../samples/SampleModal';
import SamplesOverview from '../samples/SamplesOverview';
import SamplesPage from '../samples/SamplesPage';
import BeddingPage from '../sed/BeddingPage';
import IntervalOverview from '../sed/IntervalOverview';
import IntervalPage from '../sed/IntervalPage';
import SedFeaturesPage from '../sed/SedFeaturesPage';
import StratSectionPage from '../sed/StratSectionPage';
import SiteSafetyPage from '../site-safety/SiteSafetyPage';
import SpotsRawDataView from '../spots/SpotsRawDataView';
import AddTagsModal from '../tags/AddTagsModal';
import AddTagsToSpotsModal from '../tags/AddTagsToSpotsModal';
import TagsAtSpotList from '../tags/TagsAtSpotList';
import TagsPage from '../tags/TagsPage';
import TagsShortcutModal from '../tags/TagsShortcutModal';
import TephraPage from '../tephra/TephraPage';
import AddThreeDStructureModal from '../three-d-structures/AddThreeDStructureModal';
import ThreeDStructuresOverview from '../three-d-structures/ThreeDStructuresOverview';
import ThreeDStructuresPage from '../three-d-structures/ThreeDStructuresPage';

/* Page Definitions */

// Each page's key, label, icons and components, grouped mostly by More Pages menu section. PET_PAGES instead
// groups by where its data is stored on a Spot (spot.properties.pet); Display Order below regroups it for the menu.
// Components are wrapped in functions because most of them import this file back, so whichever loads first is
// still undefined here. Called when the page or modal is shown, the function always finds it.
const OVERVIEW_PAGE = {
  key: PAGE_KEYS.OVERVIEW,
  label: 'Overview',
  page_component: () => Overview,
};

export const PRIMARY_PAGES = [
  {
    key: PAGE_KEYS.GEOLOGIC_UNITS,
    label: 'Geologic Units',
    icon_src: require('../../assets/icons/GeologicUnit.png'),
    icon_pressed_src: require('../../assets/icons/GeologicUnit_pressed.png'),
    overview_component: () => TagsAtSpotList,
    page_component: () => TagsPage,
    modal_component: () => AddTagsModal,
    action_label: 'Add Geologic Units',
  }, {
    key: PAGE_KEYS.IMAGES,
    label: 'Images',
    icon_src: require('../../assets/icons/Photo.png'),
    icon_pressed_src: require('../../assets/icons/Photo_pressed.png'),
    overview_component: () => ImagesOverview,
    page_component: () => ImagesPage,
  }, {
    key: PAGE_KEYS.MEASUREMENTS,
    label: 'Measurements',
    icon_src: require('../../assets/icons/Measurement.png'),
    icon_pressed_src: require('../../assets/icons/Measurement_pressed.png'),
    overview_component: () => MeasurementsOverview,
    page_component: () => MeasurementsPage,
    modal_component: () => AddMeasurementModal,
    action_label: 'Take a Measurement',
  }, {
    key: PAGE_KEYS.NOTES,
    label: 'Notes',
    icon_src: require('../../assets/icons/Notes.png'),
    icon_pressed_src: require('../../assets/icons/Notes_pressed.png'),
    overview_component: () => NotesOverview,
    page_component: () => NotesPage,
  }, {
    key: PAGE_KEYS.SAMPLES,
    label: 'Samples',
    icon_src: require('../../assets/icons/Sample.png'),
    icon_pressed_src: require('../../assets/icons/Sample_pressed.png'),
    overview_component: () => SamplesOverview,
    page_component: () => SamplesPage,
    modal_component: () => SampleModal,
    action_label: 'Add a Sample',
  }, {
    key: PAGE_KEYS.TAGS,
    label: 'Tags',
    icon_src: require('../../assets/icons/Tag.png'),
    icon_pressed_src: require('../../assets/icons/Tag_pressed.png'),
    overview_component: () => TagsAtSpotList,
    page_component: () => TagsPage,
    modal_component: () => AddTagsModal,
    action_label: 'Add Tags',
  },
];

const GENERAL_FEATURES_PAGES = [
  {
    key: PAGE_KEYS.THREE_D_STRUCTURES,
    label: '3D Structures',
    label_singular: '3D Structure',
    icon_src: require('../../assets/icons/3DStructure.png'),
    icon_pressed_src: require('../../assets/icons/3DStructure_pressed.png'),
    overview_component: () => ThreeDStructuresOverview,
    page_component: () => ThreeDStructuresPage,
    modal_component: () => AddThreeDStructureModal,
    action_label: 'Add a 3D Structure',
  }, {
    key: PAGE_KEYS.EARTHQUAKES,
    label: 'Earthquakes',
    icon_src: require('../../assets/icons/Earthquake.png'),
    icon_pressed_src: require('../../assets/icons/Earthquake_pressed.png'),
    page_component: () => EarthquakesPage,
    modal_component: () => AddEarthquakeModal,
    overview_component: () => FeatureOverviewList,
    action_label: 'Add an Earthquake Feature',
  }, {
    key: PAGE_KEYS.FABRICS,
    label: 'Fabrics',
    icon_src: require('../../assets/icons/Fabric.png'),
    icon_pressed_src: require('../../assets/icons/Fabric_pressed.png'),
    overview_component: () => FabricsOverview,
    page_component: () => FabricsPage,
    modal_component: () => AddFabricModal,
    action_label: 'Add a Fabric',
  }, {
    key: PAGE_KEYS.OTHER_FEATURES,
    label: 'Other Features',
    label_singular: 'Other Feature',
    icon_src: require('../../assets/icons/OtherFeatures.png'),
    icon_pressed_src: require('../../assets/icons/OtherFeatures_pressed.png'),
    overview_component: () => OtherFeaturesOverview,
    page_component: () => OtherFeaturesPage,
  }, {
    key: PAGE_KEYS.OUTCROP_SUMMARIES,
    label: 'Outcrop Summary',
    icon_src: require('../../assets/icons/OutcropSummary.png'),
    icon_pressed_src: require('../../assets/icons/OutcropSummary_pressed.png'),
    page_component: () => OutcropSummaryPage,
    testing: true,
  }, {
    key: PAGE_KEYS.TEPHRA,
    label: 'Tephra Layers',
    icon_src: require('../../assets/icons/Tephra.png'),
    icon_pressed_src: require('../../assets/icons/Tephra_pressed.png'),
    page_component: () => TephraPage,
    overview_component: () => FeatureOverviewList,
    action_label: 'Add a Tephra Layer',
  },
];

export const SUPPLEMENTAL_PAGES = [
  {
    key: PAGE_KEYS.DATA,
    label: 'Links & Tables',
    icon_src: require('../../assets/icons/Data.png'),
    icon_pressed_src: require('../../assets/icons/Data_pressed.png'),
    page_component: () => ExternalDataPage,
    overview_component: () => ExternalDataOverview,
  }, {
    key: PAGE_KEYS.REPORTS,
    label: 'Memos',
    icon_src: require('../../assets/icons/Reports.png'),
    icon_pressed_src: require('../../assets/icons/Reports_pressed.png'),
    overview_component: () => ReportsOverview,
    page_component: () => ReportsPage,
    modal_component: () => ReportModal,
  }, {
    key: PAGE_KEYS.QAQC,
    label: 'QAQC',
    icon_src: require('../../assets/icons/QAQC.png'),
    icon_pressed_src: require('../../assets/icons/QAQC_pressed.png'),
    overview_component: () => QAQCOverview,
    page_component: () => QAQCPage,
    testing: true,
  }, {
    key: PAGE_KEYS.SITE_SAFETY,
    label: 'Site Safety Summary',
    icon_src: require('../../assets/icons/SiteSafety.png'),
    icon_pressed_src: require('../../assets/icons/SiteSafety_pressed.png'),
    page_component: () => SiteSafetyPage,
  },
];

export const SUBPAGES = [
  {
    key: PAGE_KEYS.GEOGRAPHY,
    label: 'Geography',
    page_component: () => GeographyPage,
  },
  {
    key: PAGE_KEYS.IGSN,
    label: 'IGSN',
    page_component: () => IGSNPage,
  },
  {
    key: PAGE_KEYS.NESTING,
    label: 'Nesting',
    page_component: () => NestingPage,
  }, {
    key: PAGE_KEYS.METADATA,
    label: 'Metadata',
    page_component: () => MetadataPage,
  },
];

export const PET_PAGES = [
  {
    key: PAGE_KEYS.ROCK_TYPE_ALTERATION_ORE,
    label: 'Alteration, Ore Rocks',
    icon_src: require('../../assets/icons/Economic.png'),
    icon_pressed_src: require('../../assets/icons/Economic_pressed.png'),
    overview_component: () => FeatureOverviewList,
    page_component: () => RockAlterationOrePage,
    modal_component: () => AddRockModal,
    action_label: 'Add an Alteration, Ore Rock',
  }, {
    key: PAGE_KEYS.ROCK_TYPE_FAULT,
    label: 'Fault & Shear Zone Rocks',
    icon_src: require('../../assets/icons/FaultRock.png'),
    icon_pressed_src: require('../../assets/icons/FaultRock_pressed.png'),
    overview_component: () => FeatureOverviewList,
    page_component: () => RockFaultPage,
    modal_component: () => AddRockModal,
    action_label: 'Add a Fault or Shear Zone Rock',
  }, {
    key: PAGE_KEYS.ROCK_TYPE_IGNEOUS,
    label: 'Igneous Rocks',
    icon_src: require('../../assets/icons/Igneous.png'),
    icon_pressed_src: require('../../assets/icons/Igneous_pressed.png'),
    overview_component: () => FeatureOverviewList,
    page_component: () => RockIgneousPage,
    modal_component: () => AddRockModal,
    action_label: 'Add an Igneous Rock',
  }, {
    key: PAGE_KEYS.ROCK_TYPE_METAMORPHIC,
    label: 'Metamorphic Rocks',
    icon_src: require('../../assets/icons/Metamorphic.png'),
    icon_pressed_src: require('../../assets/icons/Metamorphic_pressed.png'),
    overview_component: () => FeatureOverviewList,
    page_component: () => RockMetamorphicPage,
    modal_component: () => AddRockModal,
    action_label: 'Add a Metamorphic Rock',
  }, {
    key: PAGE_KEYS.MINERALS,
    label: 'Minerals',
    icon_src: require('../../assets/icons/Minerals.png'),
    icon_pressed_src: require('../../assets/icons/Minerals_pressed.png'),
    overview_component: () => FeatureOverviewList,
    page_component: () => MineralsPage,
    modal_component: () => AddMineralModal,
    action_label: 'Add Mineral Data',
  }, {
    key: PAGE_KEYS.REACTIONS,
    label: 'Reaction Textures',
    icon_src: require('../../assets/icons/Reactions.png'),
    icon_pressed_src: require('../../assets/icons/Reactions_pressed.png'),
    overview_component: () => FeatureOverviewList,
    page_component: () => ReactionTexturesPage,
    modal_component: () => AddReactionTextureModal,
    action_label: 'Add a Reaction Texture',
    testing: true,
  }, {
    key: PAGE_KEYS.TERNARY,
    label: 'Ternary',
    label_singular: 'Ternary',
    icon_src: require('../../assets/icons/Ternary.png'),
    icon_pressed_src: require('../../assets/icons/Ternary_pressed.png'),
    page_component: () => TernaryPage,
    testing: true,
  },
];

// Sedimentary Rocks straddles two groups: its data is stored under spot.properties.sed like the
// Sedimentology pages, but the notebook lists it with the other rock types. Defined on its own so
// SED_PAGES can take it for the data and ROCK_AND_MINERAL_PAGES for the display.
const SEDIMENTARY_ROCKS_PAGE = {
  key: PAGE_KEYS.ROCK_TYPE_SEDIMENTARY,
  label: 'Sedimentary Rocks',
  icon_src: require('../../assets/icons/Sedimentary.png'),
  icon_pressed_src: require('../../assets/icons/Sedimentary_pressed.png'),
  overview_component: () => FeatureOverviewList,
  page_component: () => RockSedimentaryPage,
  modal_component: () => AddRockModal,
  action_label: 'Add a Sedimentary Rock',
};

const SEDIMENTOLOGY_PAGES = [
  {
    key: PAGE_KEYS.BEDDING,
    label: 'Bedding',
    label_singular: 'Bedding',
    icon_src: require('../../assets/icons/SedBedding.png'),
    icon_pressed_src: require('../../assets/icons/SedBedding_pressed.png'),
    page_component: () => BeddingPage,
    overview_component: () => FeatureOverviewList,
  }, {
    key: PAGE_KEYS.DIAGENESIS,
    label: 'Diagenesis',
    label_singular: 'Diagenesis',
    icon_src: require('../../assets/icons/SedDiagenesis.png'),
    icon_pressed_src: require('../../assets/icons/SedDiagenesis_pressed.png'),
    overview_component: () => FeatureOverviewList,
    page_component: () => SedFeaturesPage,
  }, {
    key: PAGE_KEYS.FOSSILS,
    label: 'Fossils',
    label_singular: 'Fossil',
    icon_src: require('../../assets/icons/SedFossil.png'),
    icon_pressed_src: require('../../assets/icons/SedFossil_pressed.png'),
    overview_component: () => FeatureOverviewList,
    page_component: () => SedFeaturesPage,
  }, {
    key: PAGE_KEYS.INTERPRETATIONS,
    label: 'Interpretations',
    label_singular: 'Interpretation',
    icon_src: require('../../assets/icons/SedInterpretation.png'),
    icon_pressed_src: require('../../assets/icons/SedInterpretation_pressed.png'),
    overview_component: () => FeatureOverviewList,
    page_component: () => SedFeaturesPage,
  }, {
    key: PAGE_KEYS.INTERVAL,
    label: 'Interval',
    label_singular: 'Interval',
    icon_src: require('../../assets/icons/SedInterval.png'),
    icon_pressed_src: require('../../assets/icons/SedInterval_pressed.png'),
    overview_component: () => IntervalOverview,
    page_component: () => IntervalPage,
  }, {
    key: PAGE_KEYS.LITHOLOGIES,
    label: 'Lithologies',
    label_singular: 'Lithology',
    icon_src: require('../../assets/icons/SedLithologies.png'),
    icon_pressed_src: require('../../assets/icons/SedLithologies_pressed.png'),
    overview_component: () => FeatureOverviewList,
    page_component: () => SedFeaturesPage,
  }, {
    key: PAGE_KEYS.STRUCTURES,
    label: 'Sedimentology Structures',
    label_singular: 'Sedimentology Structure',
    icon_src: require('../../assets/icons/SedStructure.png'),
    icon_pressed_src: require('../../assets/icons/SedStructure_pressed.png'),
    overview_component: () => FeatureOverviewList,
    page_component: () => SedFeaturesPage,
  }, {
    key: PAGE_KEYS.STRAT_SECTION,
    label: 'Strat Section',
    label_singular: 'Strat Section',
    icon_src: require('../../assets/icons/SedStratColumn.png'),
    icon_pressed_src: require('../../assets/icons/SedStratColumn_pressed.png'),
    overview_component: () => FeatureOverviewList,
    page_component: () => StratSectionPage,
  },
];

// The pages whose data is stored under spot.properties.sed. Membership matters here, not order.
export const SED_PAGES = [SEDIMENTARY_ROCKS_PAGE, ...SEDIMENTOLOGY_PAGES];

/* Display Order */

const ROCK_AND_MINERAL_PAGES = [...PET_PAGES, SEDIMENTARY_ROCKS_PAGE];

// The one place page order is defined: the More Pages menu renders these sections as-is and the Spot
// Overview orders its sections to match. Pages are sorted alphabetically within each section, so the
// definitions above do not have to be kept in order. The menu skips the first section's title, since
// that section opens the list.
export const PAGES_SECTIONS = [
  {title: 'General Info', pages: PRIMARY_PAGES},
  {title: 'General Features', pages: GENERAL_FEATURES_PAGES},
  {title: 'Rocks & Minerals', pages: ROCK_AND_MINERAL_PAGES},
  {title: 'Sedimentology', pages: SEDIMENTOLOGY_PAGES},
  {title: 'Supplemental Data', pages: SUPPLEMENTAL_PAGES},
].map(section => ({...section, pages: [...section.pages].sort((a, b) => a.label.localeCompare(b.label))}));

export const PAGES_IN_MENU_ORDER = PAGES_SECTIONS.flatMap(section => section.pages);

/* Lookups */

// Every page, for finding one by key. Built from PAGES_IN_MENU_ORDER so a new section cannot be added
// to the menu without becoming findable here, plus the Overview and subpages the menu never lists.
export const NOTEBOOK_PAGES = [OVERVIEW_PAGE, ...SUBPAGES, ...PAGES_IN_MENU_ORDER];

const NOTEBOOK_MODALS = NOTEBOOK_PAGES.filter(p => p.modal_component);

/* Modals */

export const SHORTCUT_MODALS = [
  {
    key: MODAL_KEYS.SHORTCUTS.GEOLOGIC_UNITS,
    label: 'Geologic Units',
    action_label: 'Shortcut Mode: \nAdd Geologic Unit',
    icon_src: require('../../assets/icons/GeologicUnitButtonShortcut.png'),
    icon_pressed_src: require('../../assets/icons/GeologicUnitButtonShortcut_pressed.png'),
    modal_component: () => TagsShortcutModal,
    notebook_modal_key: MODAL_KEYS.NOTEBOOK.GEOLOGIC_UNITS,
  }, {
    key: MODAL_KEYS.SHORTCUTS.TAG,
    label: 'Tag',
    action_label: 'Shortcut Mode: \nAdd Tags',
    icon_src: require('../../assets/icons/TagButtonShortcut.png'),
    icon_pressed_src: require('../../assets/icons/TagButtonShortcut_pressed.png'),
    modal_component: () => TagsShortcutModal,
    notebook_modal_key: MODAL_KEYS.NOTEBOOK.TAGS,
  }, {
    key: MODAL_KEYS.SHORTCUTS.MEASUREMENT,
    label: 'Measurement',
    action_label: 'Shortcut Mode: \nTake a Measurement',
    icon_src: require('../../assets/icons/MeasurementButtonShortcut.png'),
    icon_pressed_src: require('../../assets/icons/MeasurementButtonShortcut_pressed.png'),
    modal_component: () => AddMeasurementModal,
    notebook_modal_key: MODAL_KEYS.NOTEBOOK.MEASUREMENTS,
  }, {
    key: MODAL_KEYS.SHORTCUTS.SAMPLE,
    label: 'Sample',
    action_label: 'Shortcut Mode: \nAdd a Sample',
    icon_src: require('../../assets/icons/SampleButtonShortcut.png'),
    icon_pressed_src: require('../../assets/icons/SampleButtonShortcut_pressed.png'),
    modal_component: () => SampleModal,
    notebook_modal_key: MODAL_KEYS.NOTEBOOK.SAMPLES,
  }, {
    key: MODAL_KEYS.SHORTCUTS.NOTE,
    label: 'Note',
    action_label: 'Shortcut Mode: \nAdd a Note',
    icon_src: require('../../assets/icons/NotesButtonShortcut.png'),
    icon_pressed_src: require('../../assets/icons/NotesButtonShortcut_pressed.png'),
    modal_component: () => NotesShortcutModal,
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
    modal_component: () => AddIntervalModal,
  }, {
    key: MODAL_KEYS.OTHER.ADD_SPOTS_TO_REPORTS,
    label: 'Add Spots To Memos',
    modal_component: () => ReportsListModal,
  }, {
    key: MODAL_KEYS.OTHER.INSPECT_SPOTS_RAW_DATA,
    label: 'Inspect Spots Raw Data',
    modal_component: () => SpotsRawDataView,
  }, {
    key: MODAL_KEYS.OTHER.ADD_TAGS_TO_SPOTS,
    label: 'Add Tags To Spots',
    modal_component: () => AddTagsToSpotsModal,
  },
];

export const MODALS = [...NOTEBOOK_MODALS, ...SHORTCUT_MODALS, ...OTHER_MODALS];

/* Sample Rules */

// Which pages a sample gets, not what order they appear in. Both lists are only ever read with
// .includes(), so reordering either one changes nothing on screen — see PAGES_SECTIONS for order.
// Kept alphabetical for that reason.

// The pages a sample's Overview always shows, whether or not they hold data
export const SAMPLE_OVERVIEW_DEFAULT_PAGES = [PAGE_KEYS.GEOLOGIC_UNITS, PAGE_KEYS.IMAGES, PAGE_KEYS.SAMPLES];

// The pages a sample's More Pages menu leaves out. Samples is on both lists: a sample's Overview
// leads with its own data, but there is no point opening the Samples page from within a sample.
export const PAGES_HIDDEN_IN_SAMPLE = [PAGE_KEYS.INTERPRETATIONS, PAGE_KEYS.INTERVAL, PAGE_KEYS.OUTCROP_SUMMARIES,
  PAGE_KEYS.SAMPLES, PAGE_KEYS.SITE_SAFETY, PAGE_KEYS.STRAT_SECTION];
