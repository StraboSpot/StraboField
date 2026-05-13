import React, {useEffect, useState} from 'react';
import {SectionList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {DEPRECATED_FABRIC_TYPE, FABRICS_GROUP_KEY, FABRIC_SECTIONS_TITLES} from './fabric.constants';
import FabricListItem from './FabricListItem';
import {isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {setModalValues, setModalVisible} from '../home/home.slice';
import BasicPageDetail from '../page/BasicPageDetail';
import PageHeader from '../page/PageHeader';
import {setSelectedAttributes} from '../spots/spots.slice';

const FabricsPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Local State */

  const [isDetailView, setIsDetailView] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState({});

  /* Side Effects */

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

  /* Logic Helpers */

  const addFabric = (type) => {
    dispatch(setModalValues({type: type}));
    dispatch(setModalVisible({modal: page.key}));
  };

  const editFabric = (fabric) => {
    setIsDetailView(true);
    setSelectedFabric(fabric);
    dispatch(setModalVisible({modal: null}));
  };

  /* Render Functions */

  const renderFabricDetail = () => {
    return (
      <BasicPageDetail
        closeDetailView={() => setIsDetailView(false)}
        isReadOnly={isReadOnly}
        page={page}
        selectedFeature={selectedFabric}
      />
    );
  };

  const renderFabricSections = () => {
    let fabricsGrouped = Object.entries(FABRIC_SECTIONS_TITLES).reduce((acc, [key, title]) => {
      const data = key !== 'deprecated'
        ? spot?.properties?.[FABRICS_GROUP_KEY]?.filter(fabric => fabric.type === key) || []
        : spot?.properties?._3d_structures?.filter(struct => struct.type === DEPRECATED_FABRIC_TYPE) || [];
      return [...acc, {title, key, data: data.reverse()}];
    }, []);

    return (
      <SectionList
        ItemSeparatorComponent={FlatListItemSeparator}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => <FabricListItem editFabric={editFabric} fabric={item}/>}
        renderSectionFooter={({section}) => {
          return (
            section.data.length === 0 && (
              <ListEmptyText
                onPress={!isReadOnly && section.key !== 'deprecated' && (() => addFabric(section.key))}
                text={'No ' + section.title}
              />
            )
          );
        }}
        renderSectionHeader={({section: {title, key}}) => renderSectionHeader(title, key)}
        sections={fabricsGrouped}
        stickySectionHeadersEnabled={true}
      />
    );
  };

  const renderFabricsMain = () => {
    return (
      <View style={{flex: 1}}>
        <PageHeader pageTitle={page.label}/>
        {renderFabricSections()}
      </View>
    );
  };

  const renderSectionHeader = (sectionTitle, sectionKey) => {
    if (sectionKey !== 'deprecated' && !isReadOnly) {
      return (
        <SectionDividerWithRightButton
          dividerText={sectionTitle}
          onPress={() => addFabric(sectionKey)}
        />
      );
    }
    return <SectionDivider dividerText={sectionTitle}/>;
  };

  /* View */

  return isDetailView ? renderFabricDetail() : renderFabricsMain();
};

export default FabricsPage;
