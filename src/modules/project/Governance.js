import React from 'react';
import {FlatList} from 'react-native';

import {useSelector} from 'react-redux';

import ProjectPrivacy from './ProjectPrivacy';
import GovernanceFields from '../form/GovernanceFields';

const Governance = () => {

  const {isReadOnly: isReadOnlyProject, owner_email: ownerEmail, owner_name: ownerName} = useSelector(
    state => state.project.project);

  return (
    <FlatList
      ListHeaderComponent={
        <>
          <ProjectPrivacy/>
          <GovernanceFields isReadOnly={isReadOnlyProject} ownerEmail={ownerEmail} ownerName={ownerName}/>
        </>
      }
    />
  );
};

export default Governance;
