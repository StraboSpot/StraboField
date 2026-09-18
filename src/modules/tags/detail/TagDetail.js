import React from 'react';
import {FlatList} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import TagDetailSummaryText from './TagDetailSummaryText';
import commonStyles from '../../../shared/common.styles';
import {deepFindFeatureTypeById, isEmpty} from '../../../shared/helpers';
import NotebookPageAvatar from '../../../shared/ui/avatars/NotebookPageAvatar';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import SectionDividerWithRightButton from '../../../shared/ui/SectionDividerWithRightButton';
import {PAGE_KEYS} from '../../page/pageKeys.constants';
import ReportsListItem from '../../reports/ReportsListItem';
import SamplesSectionList from '../../samples/SamplesSectionList';
import SpotsListItem from '../../spots/SpotsListItem';
import useSpots from '../../spots/useSpots';
import useTags from '../useTags';

const TagDetail = ({
                     addRemoveFeatures,
                     addRemoveReports,
                     addRemoveSampleSpots,
                     addRemoveSpots,
                     openDetailModal,
                     openFeatureDetail,
                     openReport,
                     openSpot,
                     openSpotInNotebook,
                   }) => {
  /* Data Hooks */

  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);
  const selectedTag = useSelector(state => state.project.selectedTag);
  const spots = useSelector(state => state.spot.spots);

  const {getSpotById, getSpotWithThisSample, isSpotReadOnly} = useSpots();
  const {getAllTaggedFeatures, getFeatureDisplayComponent, getReportsWithThisTag} = useTags();

  /* Derived Variables */

  const isGeologicUnit = selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS;
  const spotsLabel = isGeologicUnit ? 'Spots With\nGeologic Unit' : 'Tagged Spots';
  const samplesLabel = isGeologicUnit ? 'Samples W/Geologic Unit' : 'Tagged Samples';

  // Gathered here rather than inside the lists, so each heading can count exactly what its section goes on to show
  const taggedSpotsIds = selectedTag.spots?.filter(
    spotId => spots[spotId] && !spots[spotId].properties.isSample) || [];
  const taggedFeatures = getAllTaggedFeatures(selectedTag);
  const taggedReports = getReportsWithThisTag(selectedTag);

  // The tagged samples, grouped under the Spot each was taken at, which is how the section list wants them. Only
  // a sample that has become a Spot of its own can carry a tag: one still held inside its Spot is tagged only in
  // the sense that the Spot is, and is listed under Tagged Spots instead
  const sampleSpots = selectedTag.spots?.reduce((acc, spotId) => {
    const spot = spots[spotId];
    if (!spot?.properties?.isSample) return acc;
    const parentSpot = getSpotWithThisSample(spotId);
    if (!parentSpot) {
      console.error('Couldn\'t find parent Spot. Was this Sample deleted?', spot);
      // dispatch(deletedSpotIdFromTags(spotId));  // Uncomment this to clean up Samples
      return acc;
    }
    const parentSpotId = parentSpot.properties.id;
    return {...acc, [parentSpotId]: [...(acc[parentSpotId] || []), spot]};
  }, {});
  const sampleSections = isEmpty(sampleSpots) ? []
    : Object.keys(sampleSpots).map(parentId => (
      {title: spots[parentId].properties.name, data: sampleSpots[parentId], spot: spots[parentId]}
    ));
  const taggedSamplesCount = sampleSections.reduce((acc, section) => acc + section.data.length, 0);

  /* Logic Helpers */

  // A section holding nothing says so in the row beneath, leaving a (0) beside its heading nothing to add
  const getDividerText = (label, count) => count > 0 ? `${label} (${count})` : label;

  /* Render Functions */

  const renderSpotFeatureItem = ({item: feature}) => {
    const spot = getSpotById(feature.parentSpotId);
    const featureType = deepFindFeatureTypeById(spot.properties, feature.id);
    if (!isEmpty(spot)) {
      const isReadOnly = isSpotReadOnly(spot);
      return (
        <ListItem
          containerStyle={commonStyles.listItem}
          key={spot.properties.id}
          onPress={() => openFeatureDetail(spot, feature, featureType)}
        >
          <NotebookPageAvatar pageKey={featureType}/>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>
              {getFeatureDisplayComponent(featureType, feature)}
            </ListItem.Title>
            <ListItem.Subtitle>{spot.properties.name}</ListItem.Subtitle>
          </ListItem.Content>
          {isReadOnly && (
            <Icon
              containerStyle={{justifyContent: 'center', paddingRight: 5}}
              name={'lock-closed'}
              size={12}
              type={'ionicon'}
            />
          )}
          <ListItem.Chevron/>
        </ListItem>
      );
    }
  };

  const renderSpotItem = ({item}) => {
    const spot = getSpotById(item);
    if (!isEmpty(spot)) return <SpotsListItem doShowTags={true} onPress={openSpot} spot={spot}/>;
  };

  const renderTaggedFeaturesList = () => {
    return (
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No Features'}/>}
        data={taggedFeatures}
        extraData={selectedTag}
        keyExtractor={item => 'Feature' + item.id.toString()}
        listKey={'features'}
        renderItem={renderSpotFeatureItem}
      />
    );
  };

  const renderTaggedMemosList = () => {
    return (
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No Memos'}/>}
        data={taggedReports}
        extraData={selectedTag}
        keyExtractor={report => 'Memo' + report.id}
        listKey={'memos'}
        renderItem={({item}) => <ReportsListItem onPress={() => openReport(item)} report={item}/>}
      />
    );
  };

  /* View */

  return (
    <FlatList
      ListHeaderComponent={
        <>
          <SectionDividerWithRightButton
            buttonTitle={isReadOnlyProject ? undefined : 'View/Edit'}
            dividerText={isGeologicUnit ? 'Geologic Unit Info' : 'Tag Info'}
            onPress={isReadOnlyProject ? undefined : openDetailModal}
          />
          {selectedTag && <TagDetailSummaryText onPress={isReadOnlyProject ? undefined : openDetailModal}/>}

          {/* Spots with this Tag */}
          <SectionDividerWithRightButton
            buttonTitle={isReadOnlyProject ? undefined : 'Add/Remove'}
            dividerText={getDividerText(spotsLabel, taggedSpotsIds.length)}
            onPress={isReadOnlyProject ? undefined : addRemoveSpots}
          />
          <FlatList
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText text={'No Spots'}/>}
            data={taggedSpotsIds}
            keyExtractor={item => 'Spot' + item.toString()}
            listKey={'spots'}
            renderItem={renderSpotItem}
          />

          {/* Samples with this Tag */}
          <SectionDividerWithRightButton
            buttonTitle={'Add/Remove'}
            dividerText={getDividerText(samplesLabel, taggedSamplesCount)}
            onPress={addRemoveSampleSpots}
          />
          <SamplesSectionList
            dataSectioned={sampleSections}
            listEmptyText={'No Samples'}
            openSpotInNotebook={openSpotInNotebook}
          />

          {/* Features and Memos with this Tag. Neither applies to a geologic unit: one is never attached to a
              single feature, and the memo tag picker leaves geologic units out */}
          {!isGeologicUnit && (
            <>
              <SectionDividerWithRightButton
                buttonTitle={isReadOnlyProject ? undefined : 'Add/Remove'}
                dividerText={getDividerText('Tagged Features', taggedFeatures.length)}
                onPress={isReadOnlyProject ? undefined : addRemoveFeatures}
              />
              {renderTaggedFeaturesList()}

              <SectionDividerWithRightButton
                buttonTitle={'Add/Remove'}
                dividerText={getDividerText('Tagged Memos', taggedReports.length)}
                onPress={addRemoveReports}
              />
              {renderTaggedMemosList()}
            </>
          )}
        </>
      }
    />
  );
};

export default TagDetail;
