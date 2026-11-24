import {replaceReport} from './reports.helpers';

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
