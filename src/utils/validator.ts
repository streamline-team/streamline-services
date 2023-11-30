import Ajv, { ErrorObject, ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

export type ValidatorErrors = ErrorObject[] | null | undefined;

export type Validate = <T>(
  data: T,
  schema: object,
  defsSchema?: object
) => {
  isValid: boolean;
  errors?: ValidatorErrors;
};

export const validator: Validate = (data, schema, defsSchema) => {
  const ajv = new Ajv({
    allErrors: true,
    $data: true,
  });

  addFormats(ajv);

  const validatorInstance: ValidateFunction = defsSchema
    ? ajv.addSchema(defsSchema).compile(schema)
    : ajv.compile(schema);

  const isValid = validatorInstance(data);

  return {
    isValid,
    errors: validatorInstance.errors,
  };
};
