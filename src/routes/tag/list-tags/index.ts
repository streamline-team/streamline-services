import { ActionProps, ActionResponse } from "config/types";
import { ListTagsResponse } from "./types";
import { tag } from "data/schema";
import { eq } from "drizzle-orm";

interface TagResult {
  id: number;
  name: string;
  background: string | null;
  createdAt: string;
  updatedAt: string;
}

const ListTags = async ({
  auth,
  repo,
}: ActionProps): ActionResponse<ListTagsResponse> => {
  if (!auth) {
    return {
      isError: true,
      code: 403,
      data: "Unauthorised",
    };
  }

  const results = await repo
    .select({
      id: tag.id,
      name: tag.name,
      background: tag.background,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    })
    .from(tag)
    .where(eq(tag.userId, auth.id));

  const data = results.reduce<Record<number, TagResult>>((acc, cur) => {
    const tagId: number = cur.id;

    if (!acc[tagId]) {
      acc[tagId] = {
        id: cur.id,
        name: cur.name,
        background: cur.background,
        createdAt: cur.createdAt.toISOString(),
        updatedAt: cur.updatedAt.toISOString(),
      };
    }

    return acc;
  }, {});

  return {
    isError: false,
    code: 200,
    data: Object.values(data),
  };
};

export default ListTags;
