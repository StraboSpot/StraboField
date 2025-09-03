import React, {useEffect, useState} from 'react';
import {SectionList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import FabricListItem from './FabricListItem';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {setModalValues, setModalVisible} from '../home/home.slice';
import BasicPageDetail from '../page/BasicPageDetail';
import ReturnToOverviewButton from '../page/ui/ReturnToOverviewButton';
import {setSelectedAttributes} from '../spots/spots.slice';

const FabricsPage = ({page}) => {
  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const [selectedFabric, setSelectedFabric] = useState({});
  const [isDetailView, setIsDetailView] = useState(false);

  const FABRIC_SECTIONS = {
    FAULT_ROCK: {title: 'Structural Fabrics', key: 'fault_rock'},
    IGNEOUS: {title: 'Igneous Fabrics', key: 'igneous_rock'},
    METAMORPHIC: {title: 'Metamorphic Fabrics', key: 'metamorphic_rock'},
    DEPRECATED: {title: 'Fabrics (Deprecated Version)', key: null},
  };

  useEffect(() => {
    console.log('UE FabricsPage []');
    return () => dispatch(setSelectedAttributes([]));
  }, []);

  useEffect(() => {
    console.log('UE FabricsPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (isEmpty(selectedAttributes)) setSelectedFabric({});
    else {
      setSelectedFabric(selectedAttributes[0]);
      setIsDetailView(true);
    }
  }, [selectedAttributes, spot]);

  const addFabric = (type) => {
    dispatch(setModalValues({type: type}));
    dispatch(setModalVisible({modal: page.key}));
  };

  const editFabric = (fabric) => {
    setIsDetailView(true);
    setSelectedFabric(fabric);
    dispatch(setModalVisible({modal: null}));
  };

  const renderFabricSections = () => {
    let fabricsGrouped = Object.values(FABRIC_SECTIONS).reduce((acc, {title, key}) => {
      const data = key ? spot?.properties?.fabrics?.filter(fabric => fabric.type === key) || []
        : spot?.properties?._3d_structures?.filter(struct => struct.type === 'fabric') || [];
      return [...acc, {title: title, data: data.reverse()}];
    }, []);

    return (
      <SectionList
        ItemSeparatorComponent={FlatListItemSeparator}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => <FabricListItem editFabric={editFabric} fabric={item}/>}
        renderSectionFooter={({section}) => {
          return section.data.length === 0 && <ListEmptyText text={'No ' + section.title}/>;
        }}
        renderSectionHeader={({section: {title}}) => renderSectionHeader(title)}
        sections={fabricsGrouped}
        stickySectionHeadersEnabled={true}
      />
    );
  };

  const renderSectionHeader = (sectionTitle) => {
    const sectionKey = Object.values(FABRIC_SECTIONS).reduce((acc, {title, key}) => {
        return sectionTitle === title ? key : acc;
      },
      '');
    if (sectionKey) {
      return (
        <SectionDividerWithRightButton
          dividerText={sectionTitle}
          onPress={() => addFabric(sectionKey)}
        />
      );
    }
    else return <SectionDivider dividerText={sectionTitle}/>;
  };

  const renderFabricDetail = () => {
    return (
      <BasicPageDetail
        closeDetailView={() => setIsDetailView(false)}
        page={page}
        selectedFeature={selectedFabric}
      />
    );
  };

  const renderFabricsMain = () => {
    return (
      <View style={{flex: 1}}>
        <ReturnToOverviewButton/>
        {renderFabricSections()}
      </View>
    );
  };

  return isDetailView ? renderFabricDetail() : renderFabricsMain();
};

export default FabricsPage;
