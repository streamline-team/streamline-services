import { JSONSchemaType } from "ajv";
import { ListTagsQuery } from "../types";

const querySchema: JSONSchemaType<ListTagsQuery> = {
  type: "object",
  additionalProperties: false,
  properties: {},
  required: [],
};

export default querySchema;
