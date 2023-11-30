import { JSONSchemaType } from "ajv";

import { UpdateTaskBody } from "../types";

const bodySchema: JSONSchemaType<UpdateTaskBody> = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    title: {
      type: "string",
      maxLength: 120,
      nullable: true,
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
    done: {
      type: "boolean",
      nullable: true,
    },
  },
  required: [],
};

export default bodySchema;
