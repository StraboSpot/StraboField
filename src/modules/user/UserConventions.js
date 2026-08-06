import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
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
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui/';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import SectionDivider from '../../shared/ui/SectionDivider';
import ConnectionRequiredMessage from '../../shared/ui/text/ConnectionRequiredMessage';
import {clearProfileUploadNeeded, setProfileUploadNeeded} from '../connections/connections.slice';
import useIsConnectionAvailable, {useConnectionTargetText} from '../connections/useConnectionStatus';
import {Form, useForm} from '../form';
import FieldInfoModal from '../form/FieldInfoModal';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import useProject from '../project/useProject';
import {editedOrCreatedSpots} from '../spots/spots.slice';

const UserProfile = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const defaultManualMeasurement = useSelector(state => state.user.default_manual_measurement);
  const isUtmDisplay = useSelector(state => state.user.is_utm_display);
  const spots = useSelector(state => state.spot.spots);
  const userData = useSelector(state => state.user);

  const isConnectionAvailable = useIsConnectionAvailable();
  const connectionTargetText = useConnectionTargetText();
  const {downloadUserProfile} = useDownload();
  const {hasErrors, validateForm} = useForm();
  const {isSpotInReadOnlyDataset} = useProject();
  const toast = useToast();
  const {uploadProfile} = useUpload();

  /* Local State */

  const formRef = useRef(null);
  const hasUnsavedConventionRef = useRef(false);

  const [fieldInfo, setFieldInfo] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  /* Side Effects */
  useEffect(() => {
    console.log('Default Manual Measurement', defaultManualMeasurement);
  }, [defaultManualMeasurement]);

  useLayoutEffect(() => {
    return () => doCleanup();
  }, []);

  /* Event Handlers */

  const onDownloadUserProfile = async () => {
    setIsDownloading(true);
    await downloadUserProfile();
    setIsDownloading(false);
  };

  // Update Redux immediately so the toggle stays in sync, and flag that a convention changed. The server upload is
  // deferred to page close (doCleanup) so rapid toggling doesn't fire a request on every change.
  const onToggleUserConvention = (key, value) => {
    dispatch(setUserData({[key]: value}));
    hasUnsavedConventionRef.current = true;
  };

  /* Logic Helpers */

  const convertStrikeDipDirection = () => {
    if (isEmpty(spots)) toast.show('No Spots found.', {placement: 'top'});
    else {
      // Filter out Read Only Spots
      const spotsFiltered = Object.values(spots).filter((spot) => {
        if (spot?.properties?.id && !isSpotInReadOnlyDataset(spot.properties.id)) return spot;
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
    // Save on close if the form changed or a convention switch was toggled. The switch value is already in the form's
    // reinitialized values (initialValues={userData}), so saveForm uploads it along with any form edits.
    if (formCurrent && (formCurrent.dirty || hasUnsavedConventionRef.current)) await saveForm(formCurrent);
  };

  const getIsDisabled = () => false;

  const saveForm = async (formCurrent) => {
    try {
      await formCurrent.submitForm();
      let newValues = JSON.parse(JSON.stringify(formCurrent.values));
      if (hasErrors(formCurrent)) throw Error('Error in form.');
      const {email, encoded_login, image, isAuthenticated, macrostrat, sesar, ...userValuesToUpdate} = newValues;
      dispatch(setUserData(userValuesToUpdate));
      if (isConnectionAvailable) {
        if (isEmpty(userData.encoded_login)) toast.show('Changes Saved Locally Only!', {type: 'success'});
        else {
          await uploadProfile(userValuesToUpdate);
          dispatch(clearProfileUploadNeeded());
          toast.show('Profile uploaded successfully!', {type: 'success'});
          toast.show('Changes Saved!', {type: 'success'});
        }
      }
      else {
        // Flag the local-only changes so ProfileSyncListener uploads them once a connection returns.
        if (!isEmpty(userData.encoded_login)) dispatch(setProfileUploadNeeded());
        toast.show(`Not connected to ${connectionTargetText} to upload profile changes`, {type: 'warning'});
        toast.show('Changes Saved Locally Only!', {type: 'success'});
      }
    }
    catch (err) {
      console.error('Error uploading profile', err);
      toast.show('Error Saving Profile', {type: 'danger'});
    }
  };

  /* Render Functions */

  // Default input mode for new measurements. Kept as a live Redux setting (not a deferred form field) so the change
  // dispatches immediately and propagates to the MeasurementsModal toggle.
  const renderMeasurementInputDefault = () => {
    const label = 'Default to Manual Measurement Entry';
    const info = 'When on, new measurements open in Manual entry mode. When off, they open in Compass (automatic) '
      + 'mode. You can still switch modes when taking a measurement.';
    return (
      <View style={{alignItems: 'center', flexDirection: 'row', paddingBottom: 10, paddingHorizontal: 10, paddingTop: 5}}>
        <SwitchWrapper
          onValueChange={value => onToggleUserConvention('default_manual_measurement', value)}
          value={defaultManualMeasurement}
        />
        <Text style={[commonStyles.listItemTitle, {flex: 1, fontWeight: 'bold', paddingLeft: 5}]}>
          {label}
        </Text>
        <Icon
          color={PRIMARY_ACCENT_COLOR}
          name={'information-circle-outline'}
          onPress={() => setFieldInfo({label, info})}
          type={'ionicon'}
        />
      </View>
    );
  };

  // Coordinate display format. Spots are always stored as WGS84 lat/lng regardless of this setting - it only
  // changes how coordinates are shown and entered.
  const renderUtmDisplay = () => {
    const label = 'Display Coordinates as UTM';
    const info = 'When on, the Geography page and map readouts show UTM zone, easting and northing instead of '
      + 'latitude and longitude. Spots are always saved as WGS84 latitude/longitude, so you can switch back and '
      + 'forth at any time without changing your data. The zone is taken from the coordinate itself and includes '
      + 'the hemisphere (e.g. 13N).';
    return (
      <View style={{alignItems: 'center', flexDirection: 'row', paddingBottom: 10, paddingHorizontal: 10, paddingTop: 5}}>
        <SwitchWrapper
          onValueChange={value => onToggleUserConvention('is_utm_display', value)}
          value={isUtmDisplay}
        />
        <Text style={[commonStyles.listItemTitle, {flex: 1, fontWeight: 'bold', paddingLeft: 5}]}>
          {label}
        </Text>
        <Icon
          color={PRIMARY_ACCENT_COLOR}
          name={'information-circle-outline'}
          onPress={() => setFieldInfo({label, info})}
          type={'ionicon'}
        />
      </View>
    );
  };

  const renderBulkUpdatesSection = () => {
    return (
      <>
        <SectionDivider dividerText={'Convert Measurements'}/>
        <OutlineButton
          onPress={convertStrikeDipDirection}
          title={'Convert Strike <-> Dip Direction'}
        />
        <View style={{paddingHorizontal: 10}}>
          <Text style={[commonStyles.importantText, {paddingHorizontal: 10}]}>
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
      <View style={{flex: 1}}>
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
              {renderMeasurementInputDefault()}
              {renderUtmDisplay()}
              {renderBulkUpdatesSection()}
              {!isEmpty(userData.encoded_login) && Platform.OS !== 'web' && (
                isConnectionAvailable ? (
                  <View style={userStyles.saveButtonContainer}>
                    <OutlineButton
                      loading={isDownloading}
                      onPress={onDownloadUserProfile}
                      title={'Download User Conventions'}
                    />
                  </View>
                ) : <ConnectionRequiredMessage actionText={'download user conventions'}/>
              )}
            </>
          }
        />
      </View>

      {/* Modal */}
      <FieldInfoModal fieldInfo={fieldInfo} onClose={() => setFieldInfo(null)}/>
    </>
  );
};

export default UserProfile;
