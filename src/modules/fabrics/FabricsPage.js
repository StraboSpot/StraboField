import React from 'react';
import {SectionList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {DEPRECATED_FABRIC_TYPE, FABRICS_GROUP_KEY, FABRIC_SECTIONS_TITLES} from './fabric.constants';
import FabricListItem from './FabricListItem';
import {isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {setActiveModal, setModalValues} from '../home/home.slice';
import FeatureDetail from '../page/FeatureDetail';
import PageHeader from '../page/PageHeader';
import useFeatureDetailView from '../page/useFeatureDetailView';

const FabricsPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {closeDetailView, isDetailView, openDetailView, selectedFeature} = useFeatureDetailView();

  /* Logic Helpers */

  const addFabric = (type) => {
    dispatch(setModalValues({type: type}));
    dispatch(setActiveModal({modal: page.key}));
  };

  /* Render Functions */

  const renderFabricDetail = () => {
    return (
      <FeatureDetail
        closeDetailView={closeDetailView}
        isReadOnly={isReadOnly}
        page={page}
        selectedFeature={selectedFeature}
      />
    );
  };

  const renderFabricSections = () => {
    let fabricsGrouped = Object.entries(FABRIC_SECTIONS_TITLES).reduce((acc, [key, title]) => {
      const data = key !== 'deprecated'
        ? spot?.properties?.[FABRICS_GROUP_KEY]?.filter(fabric => fabric.type === key) || []
        : spot?.properties?._3d_structures?.filter(struct => struct.type === DEPRECATED_FABRIC_TYPE) || [];
      return key === 'deprecated' && isEmpty(data) ? acc : [...acc, {title, key, data: data.reverse()}];
    }, []);

    return (
      <SectionList
        ItemSeparatorComponent={FlatListItemSeparator}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => <FabricListItem editFabric={openDetailView} fabric={item}/>}
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
