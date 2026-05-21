import React, {useLayoutEffect, useRef, useState} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {Formik} from 'formik';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {USER_CONVENTIONS_FORM_NAME} from './user.constants';
import userStyles from './user.styles';
import {setUserData} from './userProfile.slice';
import useDownload from '../../services/files/useDownload';
import useUpload from '../../services/files/useUpload';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import SectionDivider from '../../shared/ui/SectionDivider';
import {Form, useForm} from '../form';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import useProject from '../project/useProject';
import {editedOrCreatedSpots} from '../spots/spots.slice';

const UserProfile = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline);
  const spots = useSelector(state => state.spot.spots);
  const userData = useSelector(state => state.user);

  const {downloadUserProfile} = useDownload();
  const {hasErrors, validateForm} = useForm();
  const {isReadOnlySpot} = useProject();
  const toast = useToast();
  const {uploadProfile} = useUpload();

  /* Local State */

  const formRef = useRef(null);

  const [isDownloading, setIsDownloading] = useState(false);

  /* Side Effects */

  useLayoutEffect(() => {
    return () => doCleanup();
  }, []);

  /* Event Handlers */

  const onDownloadUserProfile = async () => {
    setIsDownloading(true);
    await downloadUserProfile();
    setIsDownloading(false);
  };

  /* Logic Helpers */

  const convertStrikeDipDirection = () => {
    if (isEmpty(spots)) toast.show('No Spots found.', {placement: 'top'});
    else {
      // Filter out Read Only Spots
      const spotsFiltered = Object.values(spots).filter((spot) => {
        if (spot?.properties?.id && !isReadOnlySpot(spot.properties.id)) return spot;
      });
      if (isEmpty(spotsFiltered)) toast.show('Only Read Only Spots found.  No changes made.', {placement: 'top'});

      else {
        const spotsEdited = [];
        let spotsEditedIds = [];
        spotsFiltered.forEach((s) => {
          if (s.properties.orientation_data) {
            let editedMeasurements = JSON.parse(JSON.stringify(s.properties.orientation_data));
            Object.values(editedMeasurements).forEach((m) => {
              if (!isEmpty(m.strike) && isEmpty(m.dip_direction)) {
                const dipDirection = (m.strike + 90) % 360;
                console.log('Strike', m.strike, '-> Dip Direction', dipDirection);
                m.dip_direction = dipDirection;
                spotsEditedIds = [...new Set([...spotsEditedIds, s.properties.id.toString()])];
              }
              else if (!isEmpty(m.dip_direction) && isEmpty(m.strike)) {
                const strike = (m.dipDirection - 90) % 360;
                console.log('Dip direction', m.dip_direction, '-> Strike', strike);
                m.strike = strike;
                spotsEditedIds = [...new Set([...spotsEditedIds, s.properties.id.toString()])];
              }
            });
            if (spotsEditedIds.includes(s.properties.id.toString())) {
              const updatedSpot = JSON.parse(JSON.stringify(s));
              updatedSpot.properties.orientation_data = editedMeasurements;
              spotsEdited.push(updatedSpot);
            }
          }
        });
        if (!isEmpty(spotsEdited)) {
          // console.log('Spots Original', Object.values(spots).reduce((acc, s) => {
          //   return spotsEditedIds.includes(s.properties.id.toString()) ? [...acc, s] : acc;
          // }, []));
          // console.log('Spots to update', spotsEdited);
          dispatch(updatedModifiedTimestampsBySpotsIds(spotsEditedIds));
          dispatch(editedOrCreatedSpots(spotsEdited));
          toast.show('Finished conversions. Spots updated', {placement: 'top', type: 'success'});
        }
        else toast.show('No conversions needed. No Spots updated.', {placement: 'top'});
      }
    }
  };

  const doCleanup = async () => {
    const formCurrent = formRef.current;
    if (formCurrent?.dirty) await saveForm(formCurrent);
  };

  const getIsDisabled = () => !(isOnline.isInternetReachable && isOnline.isConnected);

  const saveForm = async (formCurrent) => {
    try {
      await formCurrent.submitForm();
      let newValues = JSON.parse(JSON.stringify(formCurrent.values));
      if (hasErrors(formCurrent)) throw Error('Error in form.');
      const {email, encoded_login, image, isAuthenticated, macrostrat, sesar, ...userValuesToUpdate} = newValues;
      dispatch(setUserData(userValuesToUpdate));
      if (isOnline.isInternetReachable) {
        if (isEmpty(userData.encoded_login)) toast.show('Changes Saved Locally Only!', {type: 'success'});
        else {
          await uploadProfile(userValuesToUpdate);
          toast.show('Profile uploaded successfully!', {type: 'success'});
          toast.show('Changes Saved!', {type: 'success'});
        }
      }
      else {
        toast.show('Not connected to internet to upload profile changes', {type: 'warning'});
        toast.show('Changes Saved Locally Only!', {type: 'success'});
      }
    }
    catch (err) {
      console.error('Error uploading profile', err);
      toast.show('Error Saving Profile', {type: 'danger'});
    }
  };

  /* Render Functions */

  const renderBulkUpdatesSection = () => {
    return (
      <>
        <SectionDivider dividerText={'Convert Measurements'}/>
        <OutlineButton
          onPress={convertStrikeDipDirection}
          title={'Convert Strike <-> Dip Direction'}
        />
        <View style={{paddingHorizontal: 10}}>
          <Text style={[overlayStyles.importantText, {paddingHorizontal: 10}]}>
            *Changes are applied to applicable Spots throughout the entire active project. Modified timestamp are also
            updated.
          </Text>
        </View>
      </>
    );
  };

  /* View */

  return (
    <>
      <View pointerEvents={isOnline.isInternetReachable ? 'auto' : 'none'} style={{flex: 1}}>
        <FlatList
          ListHeaderComponent={
            <>
              <Formik
                component={formProps => Form(
                  {formName: USER_CONVENTIONS_FORM_NAME, getIsDisabled: getIsDisabled, ...formProps})}
                enableReinitialize={true}  // Update values if preferences change while form open
                initialValues={userData}
                innerRef={formRef}
                onSubmit={values => console.log('Submitting form...', values)}
                validate={values => validateForm({formName: USER_CONVENTIONS_FORM_NAME, values: values})}
                validateOnChange={true}
              />
              {renderBulkUpdatesSection()}
              {isOnline.isInternetReachable ? (
                <>
                  {!isEmpty(userData.encoded_login) && Platform.OS !== 'web' && (
                    <View style={userStyles.saveButtonContainer}>
                      <OutlineButton
                        loading={isDownloading}
                        onPress={onDownloadUserProfile}
                        title={'Download User Conventions'}
                      />
                    </View>
                  )}
                </>
              ) : (
                <Text style={commonStyles.noValueText}>
                  Must be online to save changes to user conventions.
                </Text>
              )}
            </>
          }
        />
      </View>
    </>
  );
};

export default UserProfile;
