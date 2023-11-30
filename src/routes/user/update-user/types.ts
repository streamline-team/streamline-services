export interface UpdateUserBody {
  name?: string | null;
}

export interface UpdateUserResponse {
  id: number;
  authId: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}
