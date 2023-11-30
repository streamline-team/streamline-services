import { JSONSchemaType } from "ajv";

import { RemoveTagFromTaskParams } from "../types";

const paramsSchema: JSONSchemaType<RemoveTagFromTaskParams> = {
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
