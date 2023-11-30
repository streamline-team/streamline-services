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
      type: "number",
      nullable: true,
    },
    done: {
      type: "boolean",
      nullable: true,
    },
    dueAt: {
      type: "string",
      format: "date-time",
      nullable: true,
    },
    sort: {
      type: "object",
      nullable: true,
      additionalProperties: false,
      properties: {
        column: {
          type: "string",
          nullable: false,
          enum: ["createdAt", "updatedAt", "priority"],
        },
        order: {
          type: "string",
          nullable: true,
          enum: ["ASC", "DESC"],
        },
      },
      required: ["column"],
    },
  },
  required: [],
};

export default querySchema;
