import { GetTagResponse } from "../get-tag/types";

export interface CreateTagBody {
  name: string;
  background: string;
}

export type CreateTagResponse = GetTagResponse;
