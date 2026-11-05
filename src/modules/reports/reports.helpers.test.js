import {getVisibleReports} from './reports.helpers';

describe('getVisibleReports', () => {
  const mine = {id: 'a', straboUserId: 7};
  const theirs = {id: 'b', straboUserId: 3};
  const theirsPrivate = {id: 'c', report_privacy: 'only_me', straboUserId: 3};
  const noAuthorPrivate = {id: 'd', report_privacy: 'only_me'};

  it('hides another user\'s only_me memo', () => {
    expect(getVisibleReports([mine, theirs, theirsPrivate], 7, 3)).toEqual([mine, theirs]);
  });

  it('shows an only_me memo to its author, comparing ids of different types', () => {
    expect(getVisibleReports([theirsPrivate], '3', 7)).toEqual([theirsPrivate]);
  });

  it('gives an only_me memo with no author to the project owner', () => {
    expect(getVisibleReports([noAuthorPrivate], 3, 3)).toEqual([noAuthorPrivate]);
    expect(getVisibleReports([noAuthorPrivate], 7, 3)).toEqual([]);
  });
});
