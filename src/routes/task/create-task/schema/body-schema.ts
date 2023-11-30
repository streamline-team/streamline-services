import { JSONSchemaType } from "ajv";

import { CreateTaskBody } from "../types";

const bodySchema: JSONSchemaType<CreateTaskBody> = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      maxLength: 120,
      nullable: false,
    },
    description: {
      type: "string",
      maxLength: 60000,
      nullable: true,
    },
    dueAt: {
      type: "string",
      format: "date-time",
      nullable: true,
    },
    priority: {
      type: "number",
      maximum: 5,
      nullable: true,
    },
    tags: {
      type: "array",
      minItems: 1,
      items: {
        type: "number",
      },
      nullable: true,
    },
  },
  required: ["title"],
};

export default bodySchema;
