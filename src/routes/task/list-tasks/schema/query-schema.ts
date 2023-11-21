import { JSONSchemaType } from "ajv";
import { ListTaskQuery } from "../types";

const querySchema: JSONSchemaType<ListTaskQuery> = {
  type: "object",
  additionalProperties: false,
  properties: {},
  required: [],
};

export default querySchema;
