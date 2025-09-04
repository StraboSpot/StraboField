import React, {useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {Button, Overlay} from '@rn-vui/base';

import {isEmpty} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR, SECONDARY_BACKGROUND_COLOR, SMALL_SCREEN} from '../../shared/styles.constants';
import ModalWrapperHeader from '../../shared/ui/modals/ModalWrapperHeader';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import {Form, formStyles, MainButtons, useForm} from '../form';

const AddRockMetamorphicModal = ({formName, formProps, setChoicesViewKey, survey}) => {
  const {width} = useWindowSize();

  const [isFaciesModalVisible, setIsFaciesModalVisible] = useState(false);

  const {getLabel} = useForm();

  // Relevant keys for quick-entry modal
  const firstKeys = ['metamorphic_rock_type'];
  const secondKeys = ['protolith'];
  const thirdKeys = ['facies'];
  const fourthKeys = ['zone'];
  const lastKeys = ['notes_metamorphic'];

  // Relevant fields for quick-entry modal
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));

  const addFacies = (faciesPressed) => {
    const currentFacies = JSON.parse(JSON.stringify(formProps.values?.facies || []));
    const updatedFacies = currentFacies.includes(faciesPressed) ? currentFacies.filter(f => f !== faciesPressed)
      : [...currentFacies, faciesPressed];
    if (isEmpty(updatedFacies)) {
      const {facies, ...valuesNew} = formProps.values;
      formProps.setValues(valuesNew);
    }
    else formProps.setFieldValue('facies', updatedFacies);
  };

  const faciesButtonText = (key) => {
    return (
      <View style={{flex: 1, alignItems: 'center'}}>
        <Text
          style={formProps?.values?.facies?.includes(key) ? formStyles.formButtonSelectedTitle
            : formStyles.formButtonTitle}>
          {getLabel(key, formName)}
        </Text>
      </View>
    );
  };

  const FaciesButton = (faciesProps) => {
    return (
      <Button
        buttonStyle={[formStyles.formButtonLarge, {
          backgroundColor: formProps?.values?.facies?.includes(faciesProps.faciesKey)
            ? PRIMARY_ACCENT_COLOR : SECONDARY_BACKGROUND_COLOR,
          height: '100%',
        }]}
        containerStyle={{padding: 2.5}}
        onPress={() => addFacies(faciesProps.faciesKey)}
        type={'outline'}
      >
        {faciesButtonText(faciesProps.faciesKey)}
      </Button>
    );
  };

  const renderFaciesModal = () => {
    const faciesModalWidth = width > 520 ? 700 : '90%';
    return (
      <Overlay
        fullScreen={SMALL_SCREEN}
        isVisible={true}
        overlayStyle={SMALL_SCREEN ? overlayStyles.overlayContainerFullScreen : [overlayStyles.overlayContainer, overlayStyles.overlayPosition, {
          width: faciesModalWidth,
          left: 20,
          height: '50%',
        }]}
        supportedOrientations={['portrait', 'landscape']}
      >
        <ModalWrapperHeader
          buttonTitleRight={'Done'}
          closeModal={() => setIsFaciesModalVisible(false)}
          title={'Facies'}
        />
        <View style={{flex: 1, padding: 10}}>
          <ScrollView contentContainerStyle={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            overflow: 'visible',
          }}>
            <View style={{flexDirection: 'row', flex: 1}}>
              {/* Pressure axis */}
              <View style={{width: 60, alignItems: 'center', justifyContent: 'center'}}>
                <Text
                  style={{
                    transform: [{rotate: '-90deg'}],
                    textAlign: 'center',
                    fontSize: 14,
                  }}
                >
                  Pressure
                </Text>
              </View>
              <View style={{
                flex: 1,
                flexDirection: 'column',
                borderStyle: 'solid',
                borderLeftWidth: 1,
                borderBottomWidth: 1,
              }}>
                <View style={{flex: 8, flexDirection: 'row'}}>
                  <View style={{flex: 9, flexDirection: 'column'}}>
                    <View style={{flex: 2, flexDirection: 'row'}}>
                      <View style={{flex: 4}}/>
                      <View style={{flex: 5}}>
                        <FaciesButton faciesKey={'eclogite'}/>
                      </View>
                    </View>
                    <View style={{flex: 4, flexDirection: 'row'}}>
                      <View style={{flex: 5, flexDirection: 'column'}}>
                        <View style={{flex: 2, flexDirection: 'row'}}>
                          <View style={{flex: 2}}/>
                          <View style={{flex: 2}}><FaciesButton faciesKey={'blueschist'}/></View>
                          <View style={{flex: 1}}/>
                        </View>
                        <View style={{flex: 2, flexDirection: 'row'}}>
                          <View style={{flex: 1}}/>
                          <View style={{flex: 2}}><FaciesButton faciesKey={'prehnite_pumpy'}/></View>
                          <View style={{flex: 2}}><FaciesButton faciesKey={'greenschist'}/></View>
                        </View>
                      </View>
                      <View style={{flex: 2}}><FaciesButton faciesKey={'amphibolite'}/></View>
                      <View style={{flex: 2}}><FaciesButton faciesKey={'upper_amph'}/></View>
                    </View>
                  </View>
                  <View style={{flex: 2}}><FaciesButton faciesKey={'granulite'}/></View>
                </View>
                <View style={{flex: 1, flexDirection: 'row'}}>
                  <View style={{flex: 2}}><FaciesButton faciesKey={'zeolite'}/></View>
                  <View style={{flex: 2}}/>
                  <View style={{flex: 5}}><FaciesButton faciesKey={'hornfels'}/></View>
                  <View style={{flex: 2}}/>
                </View>
              </View>
            </View>
          </ScrollView>
          <View style={{height: 30, alignItems: 'center', justifyContent: 'center'}}>
            <Text style={formStyles.formButtonTitle}>Temperature</Text>
          </View>
          <View style={{flexDirection: 'row', height: 40, paddingBottom: 0}}>
            <View style={{width: '50%'}}>
              <FaciesButton faciesKey={'ultra_high_pre'}/>
            </View>
            <View style={{width: '50%'}}>
              <FaciesButton faciesKey={'ultra_high_tem'}/>
            </View>
          </View>
        </View>
      </Overlay>
    );
  };

  return (
    <>
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={firstKeys}
        setChoicesViewKey={setChoicesViewKey}
      />
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={secondKeys}
        setChoicesViewKey={setChoicesViewKey}
      />
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={thirdKeys}
        setChoicesViewKey={() => setIsFaciesModalVisible(true)}
      />
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={fourthKeys}
        setChoicesViewKey={setChoicesViewKey}
      />
      <Form {...{surveyFragment: lastKeysFields, ...formProps}}/>
      {isFaciesModalVisible && renderFaciesModal()}
    </>
  );
};

export default AddRockMetamorphicModal;
