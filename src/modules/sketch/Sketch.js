import React from 'react';
import {Text, View} from 'react-native';

import RNSketchCanvas from '@StraboSpot/react-native-sketch-canvas';

import styles from './sketch.styles';
import alert from '../../shared/ui/alert';
import {useImages} from '../images';

const Sketch = ({image = {}, saveImages, setIsSketchModalVisible}) => {
  /* Data Hooks */

  const {getLocalImageURI, saveFile} = useImages();

  /* Logic Helpers */

  const saveSketch = async (success, path) => {
    try {
      console.log(success, 'Path:', path);
      if (success) {
        const savedSketch = await saveFile({...image, 'path': path});
        saveImages([savedSketch]);
        alert(
          'Sketch Saved!',
          'Sketch saved.',
          [{
            text: 'OK', onPress: () => setIsSketchModalVisible(false),
          }],
        );
      }
      else throw Error;
    }
    catch (err) {
      console.error('Error Saving Sketch', err);
      alert('Error Saving Sketch!',
        null,
        [{
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        }, {
          text: 'OK', onPress: () => setIsSketchModalVisible(false),
        }],
      );
    }
  };

  /* View */

  return (
    <View style={styles.container}>
      <View style={{flex: 1, flexDirection: 'row'}}>
        <RNSketchCanvas
          canvasStyle={{
            backgroundColor: 'transparent',
            flex: 1,
            borderWidth: 2,
            borderColor: 'grey',
          }}
          clearComponent={<View style={{...styles.functionButton, backgroundColor: 'red'}}>
            <Text style={{color: 'white'}}>Clear</Text></View>}
          closeComponent={<View style={styles.functionButton}><Text style={{color: 'white'}}>Close</Text></View>}
          containerStyle={{backgroundColor: 'transparent', flex: 1}}
          defaultStrokeIndex={0}
          defaultStrokeWidth={1}
          eraseComponent={<View style={styles.functionButton}><Text style={{color: 'white'}}>Eraser</Text></View>}
          localSourceImage={{
            filename: getLocalImageURI(image.id).replace('file://', ''),
            mode: 'AspectFit',
          }}
          maxStrokeWidth={10}
          minStrokeWidth={1}
          onClosePressed={() => setIsSketchModalVisible(false)}
          onSketchSaved={saveSketch}
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
          strokeComponent={color => <View style={[{backgroundColor: color}, styles.strokeColorButton]}/>}
          strokeSelectedComponent={color => (
            <View style={[{backgroundColor: color, borderWidth: 2}, styles.strokeColorButton]}/>
          )}
          strokeWidthComponent={w => (
            <View style={styles.strokeWidthButton}>
              <View style={{
                backgroundColor: 'white', marginHorizontal: 2.5,
                width: Math.sqrt(w / 3) * 10, height: Math.sqrt(w / 3) * 10, borderRadius: Math.sqrt(w / 3) * 10 / 2,
              }}/>
            </View>
          )}
          strokeWidthStep={1}
          undoComponent={<View style={styles.functionButton}><Text style={{color: 'white'}}>Undo</Text></View>}
        />
      </View>
    </View>
  );
};

export default Sketch;
