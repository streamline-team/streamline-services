import { JSONSchemaType } from "ajv";

import { GetTaskParams } from "../types";

const paramsSchema: JSONSchemaType<GetTaskParams> = {
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
