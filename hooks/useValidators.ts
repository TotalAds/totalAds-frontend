import { useCallback, useEffect, useRef, useState } from "react";
import { ZodSchema } from "zod";

export type Schemas = Record<string, ZodSchema>;

type Values = Record<string, any>;

export type ValidationErrors = Record<string, string[]>;

type UseValidatorsData = {
  schemas: Schemas;
  values: Values;
};

const useValidators = ({ schemas, values }: UseValidatorsData) => {
  const [startValidation, setStartValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState(
    Object.keys(schemas).reduce((obj: ValidationErrors, key) => {
      obj[key] = [];
      return obj;
    }, {})
  );

  const schemasRef = useRef(schemas);
  schemasRef.current = schemas;

  const validate = useCallback(async () => {
    const validationErrors: ValidationErrors = {};
    for (const key of Object.keys(schemasRef.current)) {
      const schema = schemasRef.current[key];
      const value = values[key];
      const validationResult = await schema.safeParseAsync(value);
      validationErrors[key] = validationResult.success
        ? []
        : validationResult.error.issues.map((err) => err.message);
    }
    setValidationErrors(validationErrors);
    return {
      validationErrors,
      hasValidationErrors: Object.values(validationErrors).some(
        (errors) => errors.length
      ),
    };
  }, [values]);

  useEffect(() => {
    if (startValidation) validate();
  }, [validate, values, startValidation]);

  return {
    validationErrors,
    hasValidationErrors: Object.values(validationErrors).some(
      (errors) => errors.length
    ),
    validationStarted: startValidation,
    startValidation: async () => {
      setStartValidation(true);
      return await validate();
    },
    reset: () => {
      setStartValidation(false);
      setValidationErrors(
        Object.keys(schemas).reduce((obj: ValidationErrors, key) => {
          obj[key] = [];
          return obj;
        }, {})
      );
    },
  };
};

export default useValidators;
