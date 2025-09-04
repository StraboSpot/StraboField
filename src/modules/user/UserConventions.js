import React, {useLayoutEffect, useRef, useState} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {Formik} from 'formik';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import userStyles from './user.styles';
import {setUserData} from './userProfile.slice';
import useDownload from '../../services/useDownload';
import useUpload from '../../services/useUpload';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import SectionDivider from '../../shared/ui/SectionDivider';
import {Form, useForm} from '../form';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedOrCreatedSpots} from '../spots/spots.slice';

const UserProfile = () => {
  const formRef = useRef(null);

  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline);
  const userData = useSelector(state => state.user);
  const spots = useSelector(state => state.spot.spots);

  const [isDownloading, setIsDownloading] = useState(false);

  const toast = useToast();
  const {downloadUserProfile} = useDownload();
  const {hasErrors, validateForm} = useForm();
  const {uploadProfile} = useUpload();

  const formName = ['general', 'user_conventions'];

  useLayoutEffect(() => {
    return () => doCleanup();
  }, []);

  const convertStrikeDipDirection = () => {
    if (isEmpty(spots)) toast.show('No Spots Found.', {placement: 'top'});
    else {
      const spotsEdited = [];
      let spotsEditedIds = [];
      Object.values(spots).forEach((s) => {
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
  };

  const doCleanup = async () => {
    if (formRef.current?.dirty) saveForm(formRef.current);
  };

  const getIsDisabled = () => !(isOnline.isInternetReachable && isOnline.isConnected);

  const onDownloadUserProfile = async () => {
    setIsDownloading(true);
    await downloadUserProfile();
    setIsDownloading(false);
  };

  const renderBulkUpdatesSection = () => {
    return (
      <>
        <SectionDivider dividerText={'Convert Measurements'}/>
        <View style={{paddingHorizontal: 10}}>
          <Button
            buttonStyle={commonStyles.standardButton}
            containerStyle={commonStyles.standardButtonContainer}
            onPress={convertStrikeDipDirection}
            title={'Convert Strike <-> Dip Direction'}
            titleStyle={commonStyles.standardButtonText}
            type={'outline'}
          />
          <Text style={[overlayStyles.importantText, {paddingHorizontal: 10}]}>
            *Changes are applied to applicable Spots throughout the entire active project. Modified timestamp are also
            updated.
          </Text>
        </View>
      </>
    );
  };

  const saveForm = async () => {
    try {
      const formCurrent = formRef.current;
      await formRef.current.submitForm();
      let newValues = JSON.parse(JSON.stringify(formCurrent.values));
      if (hasErrors(formCurrent)) throw Error('Error in form.');
      const {email, encoded_login, isAuthenticated, sesar, ...userValuesToUpdate} = newValues;
      dispatch(setUserData(userValuesToUpdate));
      if (isOnline.isInternetReachable) {
        await uploadProfile(userValuesToUpdate);
        toast.show('Profile uploaded successfully!', {type: 'success'});
      }
      else toast.show('Not connected to internet to upload profile changes', {type: 'warning'});
      toast.show('Changes Saved!', {type: 'success'});
    }
    catch (err) {
      console.error('Error uploading profile', err);
      toast.show('Error Saving Profile', {type: 'danger'});
    }
  };

  return (
    <>
      <View pointerEvents={isOnline.isInternetReachable ? 'auto' : 'none'} style={{flex: 1}}>
        <FlatList
          ListHeaderComponent={
            <>
              <Formik
                component={formProps => Form({formName: formName, getIsDisabled: getIsDisabled, ...formProps})}
                enableReinitialize={true}  // Update values if preferences change while form open
                initialValues={userData}
                innerRef={formRef}
                onSubmit={values => console.log('Submitting form...', values)}
                validate={values => validateForm({formName: formName, values: values})}
                validateOnChange={true}
              />
              {renderBulkUpdatesSection()}
              {isOnline.isInternetReachable ? (
                <View style={userStyles.saveButtonContainer}>
                  {Platform.OS !== 'web' && (
                    <Button
                      buttonStyle={commonStyles.standardButton}
                      containerStyle={commonStyles.standardButtonContainer}
                      loading={isDownloading}
                      loadingProps={userStyles.loadingSpinnerProps}
                      onPress={onDownloadUserProfile}
                      title={'Download User Conventions'}
                      titleStyle={commonStyles.standardButtonText}
                      type={'outline'}
                    />
                  )}
                </View>
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
