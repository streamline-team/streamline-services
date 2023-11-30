import { JSONSchemaType } from "ajv";

import { AddTagToTaskParams } from "../types";

const paramsSchema: JSONSchemaType<AddTagToTaskParams> = {
  type: "object",
  properties: {
    taskId: {
      type: "string",
      pattern: "^[0-9]+$",
    },
    tagId: {
      type: "string",
      pattern: "^[0-9]+$",
    },
  },
  required: ["taskId", "tagId"],
};

export default paramsSchema;
