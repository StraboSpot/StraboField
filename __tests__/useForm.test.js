import useForm from '../src/modules/form/useForm';

const PLANAR_FORM_NAME = ['measurement', 'planar_orientation'];

const PLANAR_FORM = {status: {formName: PLANAR_FORM_NAME}};

describe('showErrors', () => {
  const {showErrors} = useForm();

  it('saves the rest of the form when the bad value was already there when it opened', () => {
    const values = {dip: 95, label: 'edited'};
    const saved = showErrors({
      ...PLANAR_FORM,
      errors: {dip: 'Value must be a whole number between 0-90.'},
      initialValues: {dip: 95, label: 'original'},
      values: values,
    });
    expect(saved.label).toBe('edited');
  });

  it('never writes a bad value the user typed, even on the way out of the page', () => {
    const saved = showErrors({
      ...PLANAR_FORM,
      errors: {dip: 'Value must be a whole number between 0-90.'},
      initialValues: {dip: 45, label: 'original'},
      values: {dip: 95, label: 'edited'},
    }, true);
    expect(saved.dip).toBe(45);
    expect(saved.label).toBe('edited');
  });

  it('refuses the save when the bad value is one the user just typed', () => {
    expect(() => showErrors({
      ...PLANAR_FORM,
      errors: {dip: 'Value must be a whole number between 0-90.'},
      initialValues: {dip: 45, label: 'original'},
      values: {dip: 95, label: 'edited'},
    })).toThrow('Found validation errors.');
  });

  it('refuses the save when a nested field is the bad one, which rolling back cannot reach', () => {
    expect(() => showErrors({
      ...PLANAR_FORM,
      errors: {'associated_orientation[0].plunge': 'Value must be a whole number between 0-90.'},
      initialValues: {associated_orientation: [{plunge: 95}]},
      values: {associated_orientation: [{plunge: 95}]},
    })).toThrow('Found validation errors.');
  });
});

describe('validateForm', () => {
  const {validateForm} = useForm();

  it('reports the constraint message for a value outside its range', () => {
    const {errors} = validateForm({formName: PLANAR_FORM_NAME, values: {strike: '400'}});
    expect(errors.strike).toBe('Value must be a whole number between 0-360.');
  });

  it('finds no errors for a value within its range', () => {
    const {errors} = validateForm({formName: PLANAR_FORM_NAME, values: {strike: '40', dip: '10'}});
    expect(errors).toEqual({});
  });

  it('leaves the values it is given untouched', () => {
    const values = {strike: ' 40 ', thickness: '0.5', label: ''};
    validateForm({formName: PLANAR_FORM_NAME, values: values});
    expect(values).toEqual({strike: ' 40 ', thickness: '0.5', label: ''});
  });

  it('returns the values to save trimmed, converted from text and without the empty ones', () => {
    const {values} = validateForm({
      formName: PLANAR_FORM_NAME,
      values: {strike: '40', thickness: '0.5', notes: ' a note ', label: ''},
    });
    expect(values).toEqual({strike: 40, thickness: 0.5, notes: 'a note'});
  });

  it('requires a field that a choice on another field has made required', () => {
    const {errors} = validateForm({
      formName: ['measurement', 'linear_orientation'],
      values: {feature_type: 'vorticity_axis'},
    });
    expect(errors.vorticity).toBe('Required');
  });

  it('requires a field the survey always asks for, even before it has been touched', () => {
    const {errors} = validateForm({formName: ['general', 'site_safety'], values: {}});
    expect(errors.site_summary_author).toBe('Required');
  });

  it('marks both dates when the range is the wrong way round', () => {
    const {errors} = validateForm({
      formName: ['general', 'project_description'],
      values: {start_date: '2026-08-20T00:00:00.000Z', end_date: '2026-08-10T00:00:00.000Z'},
    });
    expect(errors.start_date).toBe('Start Date must come before End Date');
    expect(errors.end_date).toBe('Start Date must come before End Date');
  });

  it('accepts a date range that is in order, or a start date on its own', () => {
    const inOrder = validateForm({
      formName: ['general', 'project_description'],
      values: {start_date: '2026-08-10T00:00:00.000Z', end_date: '2026-08-20T00:00:00.000Z'},
    });
    const startOnly = validateForm({
      formName: ['general', 'project_description'],
      values: {start_date: '2026-08-20T00:00:00.000Z'},
    });
    expect(inOrder.errors.end_date).toBeUndefined();
    expect(startOnly.errors.end_date).toBeUndefined();
  });

  it('drops a field a choice has made irrelevant', () => {
    const {values} = validateForm({
      formName: ['measurement', 'linear_orientation'],
      values: {feature_type: 'fold_hinge', other_feature: 'not relevant to a fold hinge'},
    });
    expect(values.other_feature).toBeUndefined();
    expect(values.feature_type).toBe('fold_hinge');
  });
});
