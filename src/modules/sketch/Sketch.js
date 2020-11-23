import React, {useEffect, useState} from 'react';
import {Alert, Text, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import RNSketchCanvas from '@terrylinla/react-native-sketch-canvas';
import {useDispatch} from 'react-redux';

import useImagesHook from '../images/useImages';
import {editedSpotImages} from '../spots/spots.slice';
import styles from './sketch.styles';

const Sketch = (props) => {
  const dispatch = useDispatch();

  const navigation = useNavigation();
  const [useImages] = useImagesHook();

  const [imageId, setImageId] = useState(null);

  useEffect(() => {
    if (props.route.params?.imageId) setImageId(props.route.params.imageId);
  }, [imageId]);

  const saveSketch = async (success, path) => {
    try {
      console.log(success, 'Path:', path);
      if (success) {
        const savedSketch = await useImages.saveFile({'path': path});
        dispatch(editedSpotImages([{...savedSketch, image_type: 'sketch'}]));
        Alert.alert(`Sketch ${savedSketch.id} Saved!`,
          null,
          [{
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          }, {
            text: 'OK', onPress: () => navigation.pop(),
          }],
        );
      }
      else throw Error;
    }
    catch (err) {
      console.error('Error Saving Sketch', err);
      Alert.alert('Error Saving Sketch!',
        null,
        [{
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        }, {
          text: 'OK', onPress: () => navigation.pop(),
        }],
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={{flex: 1, flexDirection: 'row'}}>
        <RNSketchCanvas
          containerStyle={{backgroundColor: 'transparent', flex: 1}}
          canvasStyle={{
            backgroundColor: 'transparent',
            flex: 1,
            borderWidth: 2,
            borderColor: 'grey',
          }}
          localSourceImage={{
            filename: useImages.getLocalImageURI(imageId).replace('file://', ''),
            mode: 'AspectFit',
          }}
          defaultStrokeIndex={0}
          defaultStrokeWidth={1}
          onClosePressed={() => props.navigation.goBack()}
          onSketchSaved={(success, path) => saveSketch(success, path)}
          closeComponent={<View style={styles.functionButton}><Text style={{color: 'white'}}>Close</Text></View>}
          undoComponent={<View style={styles.functionButton}><Text style={{color: 'white'}}>Undo</Text></View>}
          clearComponent={<View style={styles.functionButton}><Text style={{color: 'white'}}>Clear</Text></View>}
          eraseComponent={<View style={styles.functionButton}><Text style={{color: 'white'}}>Eraser</Text></View>}
          strokeComponent={(color) => <View style={[{backgroundColor: color}, styles.strokeColorButton]}/>}
          strokeSelectedComponent={(color, index, changed) => {
            return <View style={[{backgroundColor: color, borderWidth: 2}, styles.strokeColorButton]}/>;
          }}
          strokeWidthStep={1}
          minStrokeWidth={1}
          maxStrokeWidth={10}
          strokeWidthComponent={(w) => {
            return (
              <View style={styles.strokeWidthButton}>
                <View style={{
                  backgroundColor: 'white', marginHorizontal: 2.5,
                  width: Math.sqrt(w / 3) * 10, height: Math.sqrt(w / 3) * 10, borderRadius: Math.sqrt(w / 3) * 10 / 2,
                }}/>
              </View>
            );
          }}
          saveComponent={
            <View style={styles.functionButton}>
              <Text style={{color: 'white'}}>Save</Text>
            </View>
          }
          savePreference={() => {
            return {
              folder: 'RNSketchCanvas',
              filename: String(Math.ceil(Math.random() * 100000000)),
              transparent: false,
              imageType: 'jpg',
            };
          }}
        />
      </View>
    </View>
  );
};

export default Sketch;
