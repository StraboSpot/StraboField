import {getVisibleReports, replaceReport} from './reports.helpers';

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

describe('replaceReport', () => {
  const reports = [{id: 'a', subject: 'First'}, {id: 'b', subject: 'Second'}, {id: 'c', subject: 'Third'}];

  it('puts an edited memo back in its own place rather than at the end', () => {
    const editedReport = {id: 'a', subject: 'First, edited'};
    expect(replaceReport(reports, editedReport)).toEqual([editedReport, reports[1], reports[2]]);
  });

  it('leaves the other memos as they were', () => {
    const updatedReports = replaceReport(reports, {id: 'b', subject: 'Second, edited'});
    expect(updatedReports[0]).toBe(reports[0]);
    expect(updatedReports[2]).toBe(reports[2]);
  });

  it('leaves the list it was given unchanged', () => {
    replaceReport(reports, {id: 'c', subject: 'Third, edited'});
    expect(reports[2].subject).toBe('Third');
  });
});
