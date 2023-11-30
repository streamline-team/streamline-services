import { JSONSchemaType } from "ajv";

import { UpdateTagParams } from "../types";

const paramsSchema: JSONSchemaType<UpdateTagParams> = {
  type: "object",
  properties: {
    tagId: {
      type: "string",
      pattern: "^[0-9]+$",
    },
  },
  required: ["tagId"],
};

export default paramsSchema;
