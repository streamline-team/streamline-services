import { JSONSchemaType } from "ajv";
import { UpdateUserBody } from "../types";

const bodySchema: JSONSchemaType<UpdateUserBody> = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    name: {
      type: "string",
      maxLength: 100,
      minLength: 1,
      nullable: true,
    },
  },
  required: [],
};

export default bodySchema;
