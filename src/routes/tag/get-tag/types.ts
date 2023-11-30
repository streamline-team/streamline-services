export interface GetTagParams {
  tagId: string;
}

export interface GetTagResponse {
  id: number;
  name: string;
  background: string | null;
  createdAt: string;
  updatedAt: string;
}
