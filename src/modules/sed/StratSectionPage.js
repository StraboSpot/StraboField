import React, {useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {ListItem} from '@rn-vui/base';
import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import AddImageOverlayModal from './AddImageOverlayModal';
import useSed from './useSed';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui';
import {AvatarWrapper} from '../../shared/ui/avatars';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {Form, useForm} from '../form';
import {setLoadingStatus} from '../home/home.slice';
import {setStratSection} from '../maps/maps.slice';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/page.constants';
import PageHeader from '../page/PageHeader';

const StratSectionPage = ({isReadOnly, page}) => {
  // console.log('Rendering StratSectionPage...');

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const [selectedImage, setSelectedImage] = useState(undefined);

  const stratSectionRef = useRef(null);

  const {validateForm} = useForm();
  const navigation = useNavigation();
  const {saveSedFeature, toggleStratSection} = useSed();

  const stratSection = spot.properties?.sed?.strat_section || {};

  // console.log('Spot:', spot);
  // console.log('Strat Section:', stratSection);

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

  const getImageLabel = (id) => {
    const index = spot.properties.images.findIndex(i => id === i.id);
    const image = spot.properties.images[index];
    return image && image.title ? image.title : 'Untitled ' + (index + 1);
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
    const formName = ['sed', 'strat_section'];
    return (
      <View style={{flex: 1}}>
        <SectionDivider dividerText={'Section Settings'}/>
        {!isReadOnly && (
          <SaveAndCancelButtons
            cancel={() => dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW))}
            save={saveStratSection}
          />
        )}
        <Formik
          enableReinitialize={true}
          initialValues={stratSection}
          innerRef={stratSectionRef}
          onReset={() => console.log('Resetting form...')}
          onSubmit={() => console.log('Submitting form...')}
          validate={values => validateForm({formName: formName, values: values})}
          validateOnChange={false}
        >
          {formProps => <Form {...{...formProps, formName: formName, isReadOnly: isReadOnly}}/>}
        </Formik>
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

  const renderStratSectionsMain = () => {
    return (
      <View style={{flex: 1, justifyContent: 'flex-start'}}>
        <PageHeader pageTitle={page.label}/>
        <View style={{flex: 1}}>
          <FlatList
            ListHeaderComponent={
              <>
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
              </>
            }
          />
        </View>
      </View>
    );
  };

  const saveStratSection = async () => {
    try {
      await saveSedFeature(page.key, spot, stratSectionRef.current);
      await stratSectionRef.current.resetForm();
      dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
    catch (e) {
      console.log('Error saving strat section', e);
    }
  };

  return (
    <>
      {renderStratSectionsMain()}
    </>
  );
};

export default StratSectionPage;
