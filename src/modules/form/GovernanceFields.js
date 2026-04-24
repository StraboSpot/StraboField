import React from 'react';
import {Text, TextInput, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {MEDIUMGREY} from '../../shared/styles.constants';
import SectionDivider from '../../shared/ui/SectionDivider';
import {formStyles} from '../form';

const GovernanceFields = ({isReadOnly, ownerName, ownerEmail}) => {

  const {isCollaborativeProject} = useSelector(state => state.project.project);

  if (isCollaborativeProject) {
    return (
      <>
        <SectionDivider dividerText={'Governance'}/>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <View style={formStyles.fieldLabelContainer}>
              <Text style={formStyles.fieldLabel}>{'Owner Name'}</Text>
            </View>
            <TextInput
              editable={false}
              style={formStyles.fieldValue}
              value={ownerName}
            />
            <View style={formStyles.fieldLabelContainer}>
              <Text style={formStyles.fieldLabel}>{'Owner Email'}</Text>
            </View>
            <TextInput
              editable={false}
              style={formStyles.fieldValue}
              value={ownerEmail}
            />
          </ListItem.Content>
        </ListItem>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content
            style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
          >
            <View style={{flex: 1}}>
              <View style={formStyles.fieldLabelContainer}>
                <Text style={formStyles.fieldLabel}>{'Read Only'}</Text>
              </View>
              <TextInput
                editable={false}
                style={formStyles.fieldValue}
                value={isReadOnly ? 'Yes' : 'No'}
              />
            </View>
            {isReadOnly && (
              <Icon
                color={MEDIUMGREY}
                name={'lock-closed'}
                type={'ionicon'}
              />
            )}
          </ListItem.Content>
        </ListItem>
      </>
    );
  }
};

export default GovernanceFields;
