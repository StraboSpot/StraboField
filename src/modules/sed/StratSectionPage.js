import React, {useLayoutEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {ListItem} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import AddImageOverlayModal from './AddImageOverlayModal';
import useSed from './useSed';
import commonStyles from '../../shared/common.styles';
import {isEmpty, isEqual} from '../../shared/helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui';
import alert from '../../shared/ui/alert';
import {AvatarWrapper} from '../../shared/ui/avatars';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {Form, FormFlatList, FormikWrapper} from '../form';
import {setLoadingStatus} from '../home/home.slice';
import {setStratSection} from '../maps/maps.slice';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';

const StratSectionPage = ({isReadOnly, page}) => {
  // console.log('Rendering StratSectionPage...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const navigation = useNavigation();
  const {saveSedFeature, toggleStratSection} = useSed();
  const toast = useToast();

  /* Local State */

  const stratSection = spot.properties?.sed?.strat_section || {};
  const savedValuesRef = useRef(stratSection);
  const stratSectionRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(undefined);

  /* Side Effects */

  useLayoutEffect(() => {
    return () => confirmLeavePage();
  }, []);

  /* Logic Helpers */

  const confirmLeavePage = () => {
    const formCurrent = stratSectionRef.current;
    if (formCurrent?.dirty && !isEqual(formCurrent.values, savedValuesRef.current)) {
      alert('Unsaved Changes',
        'Would you like to save your data before continuing?',
        [
          {text: 'No', style: 'cancel'},
          {text: 'Yes', onPress: () => saveStratSection(formCurrent)},
        ],
        {cancelable: false},
      );
    }
  };

  const getImageLabel = (id) => {
    const index = spot.properties.images.findIndex(i => id === i.id);
    const image = spot.properties.images[index];
    return image && image.title ? image.title : 'Untitled ' + (index + 1);
  };

  const saveStratSection = async (formCurrent = stratSectionRef.current) => {
    try {
      await saveSedFeature(page.key, spot, formCurrent);
      savedValuesRef.current = {...formCurrent.values};
      toast.show('Strat Section Settings saved', {type: 'success'});
    }
    catch (err) {
      console.error('Error saving strat section', err);
    }
  };

  /* Render Functions */

  const renderImageItem = (image) => {
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        key={image.id}
        onPress={() => setSelectedImage(image)}
      >
        <ListItem.Content style={{overflow: 'hidden'}}>
          <ListItem.Title style={commonStyles.listItemTitle}>{getImageLabel(image.id)}</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  const renderImageOverlaysSection = () => {
    const dividerText = 'Image Overlays';
    return (
      <View>
        {isReadOnly ? <SectionDivider dividerText={dividerText}/>
          : (
            <SectionDividerWithRightButton
              dividerText={dividerText}
              onPress={() => setSelectedImage({})}
            />
          )}
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={'No Image Overlays'}/>}
          data={stratSection.images}
          keyExtractor={item => item.id}
          renderItem={({item, index}) => renderImageItem(item, index)}
        />
      </View>
    );
  };

  const renderSectionSettingsSection = () => {
    const stratSectionFormName = ['sed', 'strat_section'];
    return (
      <View style={{flex: 1}}>
        <SectionDivider dividerText={'Section Settings'}/>
        <FormikWrapper
          enableReinitialize={true}
          formName={stratSectionFormName}
          initialValues={stratSection}
          innerRef={stratSectionRef}
          onReset={() => console.log('Resetting form...')}
          validateOnChange={false}
        >
          {formProps => (
            <>
              {!isReadOnly && (
                <SaveAndCancelButtons
                  cancel={() => dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW))}
                  save={() => saveStratSection(formProps)}
                />
              )}
              <Form {...formProps} formName={stratSectionFormName} isReadOnly={isReadOnly}/>
            </>
          )}
        </FormikWrapper>
      </View>
    );
  };

  const renderStratSectionsMain = () => {
    return (
      <View style={{flex: 1, justifyContent: 'flex-start'}}>
        <PageHeader pageTitle={page.label}/>
        <View style={{flex: 1}}>
          <FormFlatList>
            {renderStratSectionToggle()}
            {!isEmpty(stratSection) && (
              <View style={{flex: 1}}>
                <FlatListItemSeparator/>
                <ListItem
                  containerStyle={commonStyles.listItem}
                  key={'strat_section'}
                  onPress={() => {
                    dispatch(setLoadingStatus({view: 'home', bool: true}));
                    if (SMALL_SCREEN) navigation.navigate('HomeScreen', {screen: 'Map'});
                    setTimeout(() => {
                      dispatch(setStratSection(stratSection));
                      dispatch(setLoadingStatus({view: 'home', bool: false}));
                    }, 500);
                  }}
                >
                  <AvatarWrapper
                    size={20}
                    source={require('../../assets/icons/SedStratColumn.png')}
                  />
                  <ListItem.Content>
                    <ListItem.Title style={commonStyles.listItemTitle}>View Stratigraphic Section</ListItem.Title>
                  </ListItem.Content>
                </ListItem>
                {renderImageOverlaysSection()}
                {renderSectionSettingsSection()}
              </View>
            )}
            {selectedImage && (
              <AddImageOverlayModal
                closeModal={() => setSelectedImage(undefined)}
                image={selectedImage}
                isReadOnly={isReadOnly}
              />
            )}
          </FormFlatList>
        </View>
      </View>
    );
  };

  const renderStratSectionToggle = () => {
    return (
      <View>
        <ListItem containerStyle={commonStyles.listItem} key={'strat_section_toggle'}>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>
              Add a Stratigraphic Section at this Spot?
            </ListItem.Title>
          </ListItem.Content>
          <SwitchWrapper
            disabled={isReadOnly}
            onValueChange={() => toggleStratSection(spot)}
            value={!isEmpty(stratSection)}
          />
        </ListItem>
      </View>
    );
  };

  /* View */

  return (
    <>
      {renderStratSectionsMain()}
    </>
  );
};

export default StratSectionPage;
