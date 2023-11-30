import { JSONSchemaType } from "ajv";

import { DeleteTaskParams } from "../types";

const paramsSchema: JSONSchemaType<DeleteTaskParams> = {
  type: "object",
  additionalProperties: false,
  properties: {
    taskId: {
      type: "string",
    },
  },
  required: ["taskId"],
};

export default paramsSchema;
