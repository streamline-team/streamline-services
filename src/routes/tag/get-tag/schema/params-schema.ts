import { JSONSchemaType } from "ajv";

import { GetTagParams } from "../types";

const paramsSchema: JSONSchemaType<GetTagParams> = {
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
