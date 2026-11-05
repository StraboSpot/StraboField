import React, {useCallback, useContext, useEffect, useState} from 'react';
import {Linking, ScrollView, Text, View} from 'react-native';

import {Card} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {MacrostratContext} from './MacrostratContext';
import macrostratUnitInfoStyles from './macrostratUnitInfo.styles';
import useServerRequests from '../../../services/network/useServerRequests';
import {isEmpty} from '../../../shared/helpers';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import alert from '../../../shared/ui/alert';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import CloseButton from '../../../shared/ui/buttons/CloseButton';
import {getUtmDisplayString} from '../maps.helpers';

// The geologic map unit at the point last pressed on the Macrostrat basemap
const MacrostratUnitInfo = () => {
  /* Data Hooks */

  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);
  const isUtmDisplay = useSelector(state => state.user.is_utm_display);
  const {macrostratLocation: location, setMacrostratLocation} = useContext(MacrostratContext);

  const {getMacrostratData} = useServerRequests();

  /* Local State */

  const [dataObject, setDataObject] = useState({});
  const [showMore, setShowMore] = useState(false);

  /* Derived State */

  // MapContainer clears the location when the basemap stops being Macrostrat
  const isVisible = !!location && isOnline;

  const handleLinkPress = useCallback(async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else {
      alert(`Don't know how to open this URL: ${url}`);
    }
  }, []);

  /* Side Effects */

  useEffect(() => {
    setDataObject({});
    if (location) macrostratDataRequest();
  }, [location]);

  /* Event Handlers */

  const handleShowMore = () => setShowMore(!showMore);

  /* Logic Helpers */

  const macrostratDataRequest = async () => {
    try {
      const res = await getMacrostratData(location);
      console.log('Here is the data for the point', res);

      setDataObject(res.success.data);
    }
    catch (err) {
      console.error('Error getting macrostrat Data', err);
    }
  };

  /* Render Functions */

  const renderContent = () => {
    const {age, name, rocktype, map_ref} = dataObject;
    const lithology = rocktype?.[0] === null ? undefined : rocktype?.join(', ');
    const macrostratUrl = `https://macrostrat.org/map/loc/${location.coords[0]?.toFixed(
      2)}/${location.coords[1]?.toFixed(2)}#z=${location.zoom.toFixed(1)}`;

    return (
      <View style={{paddingVertical: 10}}>
        {[['Name', name], ['Age', age], ['Lithology', lithology], ['Source', map_ref?.ref_title]]
          .map(([label, value]) => renderField(label, isEmpty(value) ? 'N/A' : value))}
        <View style={{alignSelf: 'flex-end'}}>
          <Text onPress={() => handleLinkPress(macrostratUrl)} style={macrostratUnitInfoStyles.urlText}>
            View in Macrostrat
          </Text>
        </View>
      </View>
    );
  };

  const renderDescription = () => {
    return (
      <View style={macrostratUnitInfoStyles.descriptionContainer}>
        <Card.Divider/>
        {/* Most map units come with a description and no comments, so either one alone is shown */}
        {isEmpty(dataObject.desc) && isEmpty(dataObject.comm) ? (
          <View style={{alignItems: 'center'}}>
            <Text style={macrostratUnitInfoStyles.descriptionContent}>Description Not Available</Text>
          </View>
        ) : (
          <Text style={macrostratUnitInfoStyles.descriptionContent}>
            {renderTextWithLinks([dataObject.desc, dataObject.comm].filter(text => !isEmpty(text)).join('\n\n'))}
          </Text>
        )}
        {renderMapRef()}
      </View>
    );
  };

  // A bold label and its value, with any web address in the value made tappable
  const renderField = (label, value) => (
    <Text key={label} style={macrostratUnitInfoStyles.field}>
      <Text style={macrostratUnitInfoStyles.fieldLabel}>{label}: </Text>
      {typeof value === 'string' ? renderTextWithLinks(value) : value}
    </Text>
  );

  // A web address is linked as it is, and a bare DOI ('doi: 10.3133/ds1052') through doi.org. An ISBN has nowhere to go.
  const renderIsbnDoi = (isbnDoi) => {
    const doi = !/https?:\/\//.test(isbnDoi) && isbnDoi?.match(/10\.\d{4,9}\/\S+/)?.[0];
    if (!doi) return renderTextWithLinks(isbnDoi);
    return (
      <Text onPress={() => handleLinkPress('https://doi.org/' + doi)} style={macrostratUnitInfoStyles.urlText}>
        {isbnDoi}
      </Text>
    );
  };

  const renderMapRef = () => {
    const {url, name, authors, isbn_doi, ref_year, source_id, ref_source} = dataObject.map_ref ?? {};
    return (
      <View>
        <Card.Divider/>
        {[['URL', url], ['Name', name], ['Authors', authors], ['ISBN DOI', renderIsbnDoi(isbn_doi)],
          ['Year', ref_year], ['Source', ref_source], ['Source ID', source_id]]
          .map(([label, value]) => renderField(label, value))}
      </View>
    );
  };

  // Makes any web address in Macrostrat's free-form text tappable, leaving off punctuation that ends the sentence.
  // Splitting on a captured pattern puts the addresses at the odd indexes.
  const renderTextWithLinks = text => text?.split(/(https?:\/\/\S*[^\s.,;)])/).map((part, i) => (i % 2 === 1 ? (
    <Text key={i} onPress={() => handleLinkPress(part)} style={macrostratUnitInfoStyles.urlText}>{part}</Text>
  ) : part));

  /* View */

  if (!isVisible) return null;

  // As tall as its content, but never past its area, so below the header it scrolls rather than run off the screen
  return (
    <View
      pointerEvents={'box-none'}
      style={SMALL_SCREEN ? macrostratUnitInfoStyles.areaSmallScreen : macrostratUnitInfoStyles.area}
    >
      <Card containerStyle={macrostratUnitInfoStyles.container} wrapperStyle={macrostratUnitInfoStyles.wrapper}>
        <View style={{alignItems: 'flex-end', paddingTop: 5}}>
          <CloseButton onPress={() => setMacrostratLocation(undefined)}/>
        </View>
        <Card.Title>{isEmpty(dataObject.name) ? 'Unnamed' : dataObject.name}</Card.Title>
        {location.coords && (
          <Text style={macrostratUnitInfoStyles.coordsText}>
            {isUtmDisplay ? getUtmDisplayString(location.coords)
              : `Lat: ${location.coords[1].toFixed(4)}, Lng: ${location.coords[0].toFixed(4)}`}
          </Text>
        )}
        <ScrollView>
          {renderContent()}
          <View style={{alignItems: 'center'}}>
            <ClearButton
              onPress={handleShowMore}
              title={showMore ? 'Hide Description' : 'Show Description'}
            />
          </View>
          {showMore && renderDescription()}
        </ScrollView>
      </Card>
    </View>
  );
};

export default MacrostratUnitInfo;
