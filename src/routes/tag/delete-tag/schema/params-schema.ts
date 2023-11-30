import { JSONSchemaType } from "ajv";

import { DeleteTagParams } from "../types";

const paramsSchema: JSONSchemaType<DeleteTagParams> = {
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
