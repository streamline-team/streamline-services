import { JSONSchemaType } from "ajv";
import { ListTasksQuery } from "../types";

const querySchema: JSONSchemaType<ListTasksQuery> = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      nullable: true,
    },
    priority: {
      type: "string",
      pattern: "^(1|2|3|4|5)$",
      nullable: true,
    },
    done: {
      type: "string",
      pattern: "^(0|1)$",
      nullable: true,
    },
    dueAt: {
      type: "string",
      format: "date-time",
      nullable: true,
    },
    sortColumn: {
      type: "string",
      nullable: true,
      enum: ["createdAt", "updatedAt", "priority"],
    },
    sortOrder: {
      type: "string",
      nullable: true,
      enum: ["ASC", "DESC"],
    },
  },
  required: [],
};

export default querySchema;
