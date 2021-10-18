import { useState } from "react";

// FormEasy v0.1 - lightning fast
// [ ] TODO feat: spread input attributes in the subscribe function
// [ ] TODO feat: handle errors if validation is not set properly
// [ ] TODO feat: add uncontrolled form option

const useForm = (yup) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  let schema;
  let initialValues;

  const _getValidationErrors = async ({ schema, values }) => {
    let validationErrors = [];
    try {
      await yup.object().shape(schema).validate(values, { abortEarly: false });
      validationErrors = Object.keys(values).reduce(
        (prev, key) => ({ ...prev, [key]: [] }),
        {}
      );
    } catch (err) {
      validationErrors = err.inner.reduce(
        (prev, curr) => ({
          ...prev,
          [curr.path]: [...(prev[curr.path] || []), curr.message],
        }),
        {}
      );
    }
    return validationErrors;
  };

  const _sanitizeFormErrors = (errors) => {
    return Object.keys(errors).reduce((prev, fieldName) => {
      if (errors[fieldName].length > 0) {
        return { ...prev, [fieldName]: errors[fieldName] };
      } else {
        return { ...prev };
      }
    }, {});
  };

  const _handleInputBlur = (e) => {
    _validateField(e.target.name, e.target.value);
  };

  const _handleInputChange = (e) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;

    const fieldHasErrors = errors[fieldName] && errors[fieldName].length > 0;
    if (fieldHasErrors) _validateField(fieldName, fieldValue);

    setValues((prev) => ({ ...prev, [fieldName]: fieldValue }));
  };

  const _validateField = async (fieldName, fieldValue) => {
    const validationErrors = await _getValidationErrors({
      schema: { [fieldName]: schema[fieldName] },
      values: { [fieldName]: fieldValue },
    });

    setErrors((prev) => _sanitizeFormErrors({ ...prev, ...validationErrors }));
  };

  const _validateForm = async () => {
    const currentValues = { ...initialValues, ...values };

    const validationErrors = await _getValidationErrors({
      schema: schema,
      values: currentValues,
    });

    setErrors((prev) => _sanitizeFormErrors({ ...prev, ...validationErrors }));

    const formIsValid = Object.keys(validationErrors).reduce(
      (prev, fieldName) => validationErrors[fieldName].length === 0,
      false
    );

    return formIsValid;
  };

  const onSubmit = (handleSubmit) => ({
    onSubmit: async (e) => {
      e.preventDefault();
      const validForm = await _validateForm();
      if (!validForm) return;
      handleSubmit(e);
    },
  });

  const subscribe = (field) => {
    const fieldName = field.attribute.name;
    initialValues = { ...initialValues, [fieldName]: field.initialValue || "" };
    schema = { ...schema, [fieldName]: field.validation };

    return {
      name: fieldName,
      label: field.attribute.label,
      type: field.attribute.type,
      value: values[fieldName] || initialValues[fieldName],
      onChange: _handleInputChange,
      errors: errors[fieldName],
      onBlur: _handleInputBlur,
    };
  };

  return {
    subscribe,
    onSubmit,
    values,
    errors,
  };
};

export default useForm;
