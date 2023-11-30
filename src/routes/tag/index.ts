import Controller from "config/controller";
import { Hono } from "hono";
import GetTag from "./get-tag";
import ListTags from "./list-tags";
import UpdateTag from "./update-tag";
import DeleteTag from "./delete-tag";
import CreateTag from "./create-tag";

const tag = new Hono();

tag.get(
  "/:tagId",
  Controller({
    action: GetTag,
  })
);

tag.delete(
  "/:tagId",
  Controller({
    action: DeleteTag,
  })
);

tag.patch(
  "/:tagId",
  Controller({
    action: UpdateTag,
  })
);

tag.get(
  "/",
  Controller({
    action: ListTags,
  })
);

tag.post(
  "/",
  Controller({
    action: CreateTag,
  })
);

export default tag;
