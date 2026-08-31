/**
 * The input fields read their value, errors and setter from Formik themselves, so each one has to be given only a
 * name to work. These cover what that has to keep doing - reading a nested field by its path, showing the error
 * that validation keyed to that same path as one string, writing through Formik unless a page passes
 * setFieldValueOverride, and telling onValueChanged what was written where a page only needs to hear about it.
 */

import React from 'react';
import {TextInput} from 'react-native';

import MultiSelect from 'react-native-multiple-select';
import ReactTestRenderer, {act} from 'react-test-renderer';

import {FormikWrapper, NumberInputField, SelectInputField, TextInputField} from '../src/modules/form';
import AcknowledgeInput from '../src/modules/form/AcknowledgeInput';

const render = async (element) => {
  let tree;
  await act(async () => {
    tree = ReactTestRenderer.create(element);
  });
  return tree;
};

const renderedText = tree => JSON.stringify(tree.toJSON());

describe('TextInputField', () => {
  it('shows the value Formik holds for its name and writes what is typed back', async () => {
    const formRef = React.createRef();
    const tree = await render(
      <FormikWrapper initialValues={{note: 'hello'}} innerRef={formRef}>
        <TextInputField label={'Note'} name={'note'}/>
      </FormikWrapper>,
    );

    expect(tree.root.findByType(TextInput).props.value).toBe('hello');

    await act(async () => tree.root.findByType(TextInput).props.onChangeText('goodbye'));
    expect(formRef.current.values.note).toBe('goodbye');
  });

  it('leaves the writing to the setter the caller gives it', async () => {
    const formRef = React.createRef();
    const setFieldValueOverride = jest.fn();
    const tree = await render(
      <FormikWrapper initialValues={{note: 'hello'}} innerRef={formRef}>
        <TextInputField label={'Note'} name={'note'} setFieldValueOverride={setFieldValueOverride}/>
      </FormikWrapper>,
    );

    await act(async () => tree.root.findByType(TextInput).props.onChangeText('goodbye'));
    expect(setFieldValueOverride).toHaveBeenCalledWith('note', 'goodbye');
    expect(formRef.current.values.note).toBe('hello');
  });
});

describe('NumberInputField', () => {
  // An associated orientation's fields are named by their path but their errors are keyed by that path as one
  // string, which is why the fields read form.errors rather than useField's meta.error
  it('reads a nested field by its path and shows the error keyed to that whole path', async () => {
    const formRef = React.createRef();
    const tree = await render(
      <FormikWrapper
        initialValues={{associated_orientation: [{plunge: 95}]}}
        innerRef={formRef}
        validate={() => ({'associated_orientation[0].plunge': 'Must be less than 90'})}
      >
        <NumberInputField label={'Plunge'} name={'associated_orientation[0].plunge'}/>
      </FormikWrapper>,
    );

    expect(tree.root.findByType(TextInput).props.value).toBe('95');

    await act(async () => {
      await formRef.current.validateForm();
    });
    expect(renderedText(tree)).toContain('Must be less than 90');
  });
});

describe('SelectInputField', () => {
  it('writes the choice through Formik when the caller gives it no setter of its own', async () => {
    const formRef = React.createRef();
    const tree = await render(
      <FormikWrapper initialValues={{type: undefined}} innerRef={formRef}>
        <SelectInputField
          choices={[{label: 'Fold', value: 'fold'}, {label: 'Fault', value: 'fault'}]}
          isSingleSelect={true}
          label={'Feature Type'}
          name={'type'}
        />
      </FormikWrapper>,
    );

    await act(async () => tree.root.findByType(MultiSelect).props.onSelectedItemsChange(['fold']));
    expect(formRef.current.values.type).toBe('fold');
  });

  it('writes through the setter the caller gives it instead', async () => {
    const setFieldValueOverride = jest.fn();
    const tree = await render(
      <FormikWrapper initialValues={{type: undefined}}>
        <SelectInputField
          choices={[{label: 'Fold', value: 'fold'}]}
          isSingleSelect={true}
          label={'Feature Type'}
          name={'type'}
          setFieldValueOverride={setFieldValueOverride}
        />
      </FormikWrapper>,
    );

    await act(async () => tree.root.findByType(MultiSelect).props.onSelectedItemsChange(['fold']));
    expect(setFieldValueOverride).toHaveBeenCalledWith('type', 'fold');
  });

  // Deselecting and choosing both go through the one setter now. They used to split - a deselect wrote straight to
  // Formik while a choice went through the page's handler - so the page never saw the field being emptied
  it('sends a deselect through that same setter', async () => {
    const setFieldValueOverride = jest.fn();
    const tree = await render(
      <FormikWrapper initialValues={{type: 'fold'}}>
        <SelectInputField
          choices={[{label: 'Fold', value: 'fold'}]}
          isSingleSelect={true}
          label={'Feature Type'}
          name={'type'}
          setFieldValueOverride={setFieldValueOverride}
        />
      </FormikWrapper>,
    );

    await act(async () => tree.root.findByType(MultiSelect).props.onSelectedItemsChange(['fold']));
    expect(setFieldValueOverride).toHaveBeenCalledWith('type', undefined);
  });

  // The other half of the pair: onValueChanged leaves the write alone and runs after it, for a page that only has
  // something of its own to do once the value is in
  it('writes as usual and then tells onValueChanged what was written', async () => {
    const formRef = React.createRef();
    const onValueChanged = jest.fn();
    const tree = await render(
      <FormikWrapper initialValues={{type: undefined}} innerRef={formRef}>
        <SelectInputField
          choices={[{label: 'Fold', value: 'fold'}]}
          isSingleSelect={true}
          label={'Feature Type'}
          name={'type'}
          onValueChanged={onValueChanged}
        />
      </FormikWrapper>,
    );

    await act(async () => tree.root.findByType(MultiSelect).props.onSelectedItemsChange(['fold']));
    expect(formRef.current.values.type).toBe('fold');
    expect(onValueChanged).toHaveBeenCalledWith('type', 'fold');
  });

  it('tells onValueChanged about a deselect too, so a page sees the field emptied', async () => {
    const onValueChanged = jest.fn();
    const tree = await render(
      <FormikWrapper initialValues={{type: 'fold'}}>
        <SelectInputField
          choices={[{label: 'Fold', value: 'fold'}]}
          isSingleSelect={true}
          label={'Feature Type'}
          name={'type'}
          onValueChanged={onValueChanged}
        />
      </FormikWrapper>,
    );

    await act(async () => tree.root.findByType(MultiSelect).props.onSelectedItemsChange(['fold']));
    expect(onValueChanged).toHaveBeenCalledWith('type', undefined);
  });

  it('sends a multiple-choice change through that same setter', async () => {
    const setFieldValueOverride = jest.fn();
    const tree = await render(
      <FormikWrapper initialValues={{types: []}}>
        <SelectInputField
          choices={[{label: 'Fold', value: 'fold'}, {label: 'Fault', value: 'fault'}]}
          label={'Feature Types'}
          name={'types'}
          setFieldValueOverride={setFieldValueOverride}
        />
      </FormikWrapper>,
    );

    await act(async () => tree.root.findByType(MultiSelect).props.onSelectedItemsChange(['fold', 'fault']));
    expect(setFieldValueOverride).toHaveBeenCalledWith('types', ['fold', 'fault']);
  });
});

describe('AcknowledgeInput', () => {
  it('shows the value Formik holds for its name and writes the toggle through the setter it is given', async () => {
    const setFieldValueOverride = jest.fn();
    const tree = await render(
      <FormikWrapper initialValues={{acknowledged: false}}>
        <AcknowledgeInput label={'Acknowledged'} name={'acknowledged'} setFieldValueOverride={setFieldValueOverride}/>
      </FormikWrapper>,
    );

    const toggle = tree.root.findAllByProps({value: false}).find(node => node.props.onValueChange);
    await act(async () => toggle.props.onValueChange(true));
    expect(setFieldValueOverride).toHaveBeenCalledWith('acknowledged', true);
  });
});
