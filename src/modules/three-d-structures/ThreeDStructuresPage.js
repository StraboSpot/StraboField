import React, {useEffect, useState} from 'react';
import {SectionList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ThreeDStructureItem from './ThreeDStructureItem';
import {getNewId, isEmpty, toTitleCase} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import BasicPageDetail from '../page/BasicPageDetail';
import PageHeader from '../page/PageHeader';
import {setSelectedAttributes} from '../spots/spots.slice';

const SECTIONS = {
  // FABRICS: {title: 'Fabrics', key: 'fabric'}, // Hidden here and displayed on Fabrics page as deprecated
  FOLDS: {title: 'Folds', key: 'fold'},
  FAULTS: {title: 'Faults', key: 'fault'},
  TENSORS: {title: 'Tensors', key: 'tensor'},
  OTHER: {title: 'Other', key: 'other'},
};

const ThreeDStructuresPage = ({isReadOnly, page}) => {
  /* Data Hooks / State */

  const dispatch = useDispatch();

  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getLabel} = useForm();

  const [isDetailView, setIsDetailView] = useState(false);
  const [selected3dStructure, setSelected3dStructure] = useState({});

  /* Side Effects */

  useEffect(() => {
    console.log('UE ThreeDStructuresPage []');
    return () => dispatch(setSelectedAttributes([]));
  }, []);

  useEffect(() => {
    console.log('UE ThreeDStructuresPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (isEmpty(selectedAttributes)) setSelected3dStructure({});
    else if (!isMultipleFeaturesTaggingEnabled) {
      setSelected3dStructure(selectedAttributes[0]);
      setIsDetailView(true);
    }
  }, [selectedAttributes, spot]);

  /* Logic Helpers */

  const add3dStructure = (type) => {
    const new3dStructure = {id: getNewId(), type: type};
    dispatch(setModalValues(new3dStructure));
    dispatch(setModalVisible({modal: page.key}));
  };

  const edit3dStructure = (threeDStructure) => {
    dispatch(setSelectedAttributes([threeDStructure]));
    setSelected3dStructure(threeDStructure);
    setIsDetailView(true);
  };

  const get3dStructureTitle = (threeDStructure) => {
    return threeDStructure.label
      || toTitleCase(getLabel(threeDStructure.feature_type || threeDStructure.fault_or_sz_type,
        ['_3d_structures', threeDStructure.type]).toUpperCase())
      || '';
  };

  /* Render Functions */

  const render3dStructure = (threeDStructure) => {
    return <ThreeDStructureItem edit3dStructure={item => edit3dStructure((item))} item={threeDStructure}/>;
  };

  const renderSectionHeader = (sectionTitle) => {
    const sectionKey = Object.values(SECTIONS).reduce(
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
    const dataSectioned = Object.values(SECTIONS).reduce((acc, {title, key}) => {
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
          return data.length === 0 && <ListEmptyText text={'No ' + title + ' Observations'}/>;
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
        <BasicPageDetail
          closeDetailView={() => setIsDetailView(false)}
          isReadOnly={isReadOnly}
          page={page}
          selectedFeature={selected3dStructure}
        />
      )}
    </>
  );
};

export default ThreeDStructuresPage;
