import { JSONSchemaType } from "ajv";

import { CreateTagBody } from "../types";

const bodySchema: JSONSchemaType<CreateTagBody> = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      maxLength: 100,
    },
    background: {
      type: "string",
      pattern: "^#([A-F0-9]{6}|[A-F0-9]{3})$",
    },
  },
  required: ["name", "background"],
};

export default bodySchema;
