import { JSONSchemaType } from "ajv";

import { UpdateTaskParams } from "../types";

const paramsSchema: JSONSchemaType<UpdateTaskParams> = {
  type: "object",
  properties: {
    taskId: {
      type: "string",
      pattern: "^[0-9]+$",
    },
  },
  required: ["taskId"],
};

export default paramsSchema;
