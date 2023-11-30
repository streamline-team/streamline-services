import { JSONSchemaType } from "ajv";

import { UpdateTagBody } from "../types";

const bodySchema: JSONSchemaType<UpdateTagBody> = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    name: {
      type: "string",
      maxLength: 100,
      nullable: true,
    },
    background: {
      type: "string",
      pattern: "^#([A-F0-9]{6}|[A-F0-9]{3})$",
      nullable: true,
    },
  },
  required: [],
};

export default bodySchema;
