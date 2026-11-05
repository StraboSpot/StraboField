import React from 'react';
import {SectionList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ThreeDStructureItem from './ThreeDStructureItem';
import {THREE_D_STRUCTURE_SECTIONS} from './threeDStructures.constants';
import {getNewUUID, toTitleCase} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import useForm from '../form/useForm';
import {setActiveModal, setModalValues} from '../home/home.slice';
import FeatureDetail from '../page/FeatureDetail';
import PageHeader from '../page/PageHeader';
import useFeatureDetailView from '../page/useFeatureDetailView';

const ThreeDStructuresPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {closeDetailView, isDetailView, openDetailView, selectedFeature} = useFeatureDetailView();
  const {getLabel} = useForm();

  /* Logic Helpers */

  const add3dStructure = (type) => {
    const new3dStructure = {id: getNewUUID(), type: type};
    dispatch(setModalValues(new3dStructure));
    dispatch(setActiveModal({modal: page.key}));
  };

  const get3dStructureTitle = (threeDStructure) => {
    return threeDStructure.label
      || toTitleCase(getLabel(threeDStructure.feature_type || threeDStructure.fault_or_sz_type,
        ['_3d_structures', threeDStructure.type]))
      || '';
  };

  /* Render Functions */

  const render3dStructure = (threeDStructure) => {
    return <ThreeDStructureItem edit3dStructure={openDetailView} item={threeDStructure}/>;
  };

  const renderSectionHeader = (sectionTitle) => {
    const sectionKey = Object.values(THREE_D_STRUCTURE_SECTIONS).reduce(
      (acc, {title, key}) => sectionTitle === title ? key : acc, '');
    return (
      <>
        {isReadOnly ? <SectionDivider dividerText={sectionTitle}/>
          : (
            <SectionDividerWithRightButton
              disabled={isMultipleFeaturesTaggingEnabled}
              dividerText={sectionTitle}
              onPress={() => add3dStructure(sectionKey)}
            />
          )}
      </>
    );
  };

  const renderSections = () => {
    const dataSectioned = Object.values(THREE_D_STRUCTURE_SECTIONS).reduce((acc, {title, key}) => {
      const data = spot?.properties?._3d_structures?.filter(d => d.type === key) || [];
      const dataSorted = data.slice().sort((a, b) => get3dStructureTitle(a).localeCompare(get3dStructureTitle(b)));
      return [...acc, {title: title, data: dataSorted}];
    }, []);

    return (
      <SectionList
        ItemSeparatorComponent={FlatListItemSeparator}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => render3dStructure(item)}
        renderSectionFooter={({section: {data, title}}) => {
          const sectionKey = Object.values(THREE_D_STRUCTURE_SECTIONS).reduce(
            (acc, {title: t, key}) => title === t ? key : acc, '');
          return (
            data.length === 0 && (
              <ListEmptyText
                onPress={!isReadOnly && !isMultipleFeaturesTaggingEnabled && (() => add3dStructure(sectionKey))}
                text={'No ' + title + ' Observations'}
              />
            )
          );
        }}
        renderSectionHeader={({section: {title}}) => renderSectionHeader(title)}
        sections={dataSectioned}
        stickySectionHeadersEnabled={true}
      />
    );
  };

  /* View */

  return (
    <>
      {!isDetailView && (
        <View>
          <PageHeader pageTitle={page.label} showFeaturesTagButton={!isReadOnly}/>
          {renderSections()}
        </View>
      )}
      {isDetailView && (
        <FeatureDetail
          closeDetailView={closeDetailView}
          isReadOnly={isReadOnly}
          page={page}
          selectedFeature={selectedFeature}
        />
      )}
    </>
  );
};

export default ThreeDStructuresPage;
