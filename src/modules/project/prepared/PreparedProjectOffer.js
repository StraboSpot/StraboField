import {useEffect} from 'react';

import {useSelector} from 'react-redux';

import {describePackage, getPreparedProjectName, getPreparedProjectToOffer} from './preparedProjects.helpers';
import usePreparedProjects from './usePreparedProjects';
import alert from '../../../shared/ui/alert';

// Set by a sign-in, so the offer is made once per sign-in rather than on every launch of the app
let isOfferPending = false;

export const offerPreparedProjectAfterSignIn = () => {
  isOfferPending = true;
};

// Headless (mounted in ModalsContainer, native only, testing mode only). After a sign-in, asks whether to install
// a project prepared for the account on the website and not installed yet. Declining leaves it in StraboField
// Projects to install later.
const PreparedProjectOffer = () => {
  /* Data Hooks */

  const isAuthenticated = useSelector(state => state.user.isAuthenticated);
  const isTestingMode = useSelector(state => state.project.isTestingMode);
  const preparedProjects = useSelector(state => state.user.prepared_projects);

  const {installPreparedProject} = usePreparedProjects();

  /* Side Effects */

  useEffect(() => {
    if (!isOfferPending || !isAuthenticated) return;
    isOfferPending = false;
    if (!isTestingMode) return; // After clearing, so turning testing mode on later makes no stale offer
    const preparedProject = getPreparedProjectToOffer(preparedProjects);
    if (!preparedProject) return;
    // Give the screen a moment to settle after signing in, so the question isn't lost in the transition
    setTimeout(() => {
      alert('Install Prepared Project?',
        `"${getPreparedProjectName(preparedProject)}" has been prepared for your account`
        + ` (${describePackage(preparedProject)}). Download and install it now?\n\n`
        + 'You can also install it later from Prepared Projects, on the welcome screen or under StraboField'
        + ' Projects in the main menu.',
        [
          {style: 'cancel', text: 'Not Now'},
          {onPress: () => installPreparedProject(preparedProject), text: 'Install'},
        ]);
    }, 500);
  }, [isAuthenticated, preparedProjects]);

  return null;
};

export default PreparedProjectOffer;
