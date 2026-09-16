import {useEffect} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {setShortcutSwitchPositions} from './home.slice';
import {isEmpty} from '../../shared/helpers';

// Every shortcut creates a Spot, so the shortcuts are only usable while there is a target dataset to file
// them into. Losing the target turns them all off rather than leaving switches on that would only report
// there is nowhere to save to. Both the map buttons and the preferences switches have to do this, and
// neither is mounted often enough to be the only one that does - the map buttons are hidden on an image
// basemap or strat section, the preferences list only exists while its page is open.
const useShortcutSwitches = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const shortcutSwitchPositions = useSelector(state => state.home.shortcutSwitchPosition);
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  /* Derived Variables */

  const isTargetDatasetMissing = isEmpty(targetDatasetId);

  /* Side Effects */

  useEffect(() => {
    if (!isTargetDatasetMissing) return;
    if (Object.values(shortcutSwitchPositions).some(Boolean)) {
      dispatch(setShortcutSwitchPositions({switchName: 'all', value: false}));
    }
  }, [dispatch, isTargetDatasetMissing, shortcutSwitchPositions]);

  return {isTargetDatasetMissing, shortcutSwitchPositions};
};

export default useShortcutSwitches;
