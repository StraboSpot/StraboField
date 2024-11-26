import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Linking, ScrollView, Text, TouchableOpacity, View} from 'react-native';

import {Button, Card, Icon} from 'react-native-elements';

import macrostratOverlayStyles from './macrostratOverlay.styles';
import useServerRequests from '../../../services/useServerRequests';
import {isEmpty, truncateText} from '../../../shared/Helpers';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import commonStyles from '../../../shared/common.styles';
import alert from '../../../shared/ui/alert';
import * as Helpers from '../../../shared/Helpers';

const MacrostratOverlay = ({
                             isVisible,
                             closeModal,
                             location,
                           }) => {

  // let ref = useRef(null);
  const [expandedGeologicMap, setExpandedGeologicMap] = useState(true);
  const [dataObject, setDataObject] = useState({});
  const [showMore, setShowMore] = useState(false);
  const [showMapRef, setShowMapRef] = useState(false);

  const {getMacrostratData} = useServerRequests();

  useEffect(() => {
    return () => {
      console.log('Closing Macrostrat modal and setting to {}');
      setDataObject({});
    };
  }, []);

  useEffect(() => {
    macrostratDataRequest().then((res) => {
      console.log('complete', res);
    });
  }, [location]);

  const copyToClipboard = () => {
    Helpers.copyToClipboard(dataObject.comm);
  };

  const handleLinkPress = useCallback(async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else {
      alert(`Don't know how to open this URL: ${url}`);
    }
  }, []);

  const handleShowMore = () => {
    setShowMore(!showMore);
  };

  const macrostratDataRequest = async () => {
    try {
      const res = await getMacrostratData(location);
      console.log('Here is the data for the point', res);

      setDataObject(res.success.data);
    }
    catch (err) {
      console.error('Error getting Macrostrat Data', err);
    }
  };

  const renderContent = () => {
    const {age, name, rocktype, map_ref} = dataObject;
    const commaSeparatedString = rocktype?.join(', ');
    const macrostratUrl = `https://www.macrostrat.org/map/loc/${location.coords[0]?.toFixed(
      2)}/${location.coords[1]?.toFixed(2)}#z=${location.zoom.toFixed(1)}`;

    return (
      <ScrollView style={{padding: 10}}>
        <Text style={macrostratOverlayStyles.contentKey}>Name: <Text
          style={macrostratOverlayStyles.contentText}>{isEmpty(name) ? 'N/A' : name}</Text></Text>
        <Text style={macrostratOverlayStyles.contentKey}>Age: <Text
          style={macrostratOverlayStyles.contentText}>{isEmpty(age) ? 'N/A' : age}</Text></Text>
        <Text style={macrostratOverlayStyles.contentKey}>Lithology: <Text
          style={macrostratOverlayStyles.contentText}>{isEmpty(
          rocktype) || (rocktype?.[0] === null) ? 'N/A' : commaSeparatedString}</Text></Text>
        <Text style={macrostratOverlayStyles.mapRefContent}><Text
          style={macrostratOverlayStyles.mapRefBoldText}>Source:</Text> {isEmpty(
          map_ref?.ref_title) ? 'N/A' : map_ref?.ref_title}</Text>
        <View style={{alignSelf: 'flex-end'}}>
          <Text
            onPress={() => handleLinkPress(macrostratUrl)}
            style={[macrostratOverlayStyles.urlText, macrostratOverlayStyles.attributionText]}>View in Macrostrat
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderDescription = () => {
    return (
      <ScrollView style={macrostratOverlayStyles.descriptionContainer}>
        <Card.Divider/>
        {showMore && <View>
          {isEmpty(dataObject.desc) || isEmpty(dataObject.comm)
            ? (
              <View style={{alignItems: 'center'}}>
                <Text style={macrostratOverlayStyles.descriptionContent}>Description Not Available</Text>
              </View>
            )
            : (
              <>
                <Button
                  type={'clear'}
                  containerStyle={{alignSelf: 'flex-end'}}
                  onPress={copyToClipboard}
                  icon={{
                    name: 'copy-outline',
                    type: 'ionicon',
                    size: 25,
                    // color: "white"
                  }}
                />
                <Text
                  style={macrostratOverlayStyles.descriptionContent}>{dataObject.desc} {'\n\n'}{dataObject.comm}</Text>
              </>
            )
          }
          {renderMapRef()}
        </View>}
      </ScrollView>
    );
  };

  const renderMapRef = () => {
    const {url, name, authors, isbn_doi, ref_year, source_id, ref_source} = dataObject.map_ref;
    return (
      <View>
        <Card.Divider/>
        <Text style={macrostratOverlayStyles.mapRefContent}>
          <Text
            style={macrostratOverlayStyles.mapRefBoldText}>Url:
          </Text>
          <Text
            onPress={() => handleLinkPress(url)}
            style={macrostratOverlayStyles.urlText}> {!isEmpty(url) && url}</Text>
        </Text>
        <Text style={macrostratOverlayStyles.mapRefContent}><Text
          style={macrostratOverlayStyles.mapRefBoldText}>Name:</Text> {name}</Text>
        <Text style={macrostratOverlayStyles.mapRefContent}><Text
          style={macrostratOverlayStyles.mapRefBoldText}>Authors:</Text> {authors}</Text>
        <Text style={macrostratOverlayStyles.mapRefContent}><Text style={macrostratOverlayStyles.mapRefBoldText}>ISBN
          DOI:</Text> {isbn_doi}</Text>
        <Text style={macrostratOverlayStyles.mapRefContent}><Text
          style={macrostratOverlayStyles.mapRefBoldText}>Year:</Text> {ref_year}</Text>
        <Text style={macrostratOverlayStyles.mapRefContent}><Text
          style={macrostratOverlayStyles.mapRefBoldText}>Source:</Text> {ref_source}</Text>
        <Text style={macrostratOverlayStyles.mapRefContent}><Text style={macrostratOverlayStyles.mapRefBoldText}>Source
          ID:</Text> {source_id}</Text>
      </View>
    );
  };

  return (
    <>
      {isVisible
        && (
          <Card
            containerStyle={SMALL_SCREEN ? [macrostratOverlayStyles.containerPositionSmallScreen] : [macrostratOverlayStyles.container]}>
            <Button
              title={'Close'}
              containerStyle={{alignItems: 'flex-end'}}
              onPress={closeModal}
              type={'clear'}
            />
            <Card.Title>{isEmpty(dataObject.name) ? 'Unnamed' : dataObject.name}</Card.Title>
            {location.coords && (
              <Text style={macrostratOverlayStyles.coordsText}>Lat: {location.coords[1].toFixed(4)},
                Lng: {location.coords[0].toFixed(
                  4)}
              </Text>
            )}
            {renderContent()}
            <View style={{alignItems: 'center', justifyContent: 'flex-end'}}>
              <Button
                type={'clear'}
                title={showMore ? 'Hide Description' : 'Show Description'}
                // containerStyle={commonStyles.buttonContainer}
                onPress={handleShowMore}>
              </Button>
              {renderDescription()}

            </View>
          </Card>
        )}
    </>
  );
};

export default MacrostratOverlay;
