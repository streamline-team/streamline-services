import { GetTagResponse } from "../get-tag/types";

export interface UpdateTagBody {
  name?: string;
  background?: string;
}

export interface UpdateTagParams {
  tagId: string;
}

export type UpdateTagResponse = GetTagResponse;
