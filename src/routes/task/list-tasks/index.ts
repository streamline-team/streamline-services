import { ActionProps, ActionResponse } from "config/types";

const ListTasks = async ({}: ActionProps): ActionResponse<{}> => {
  return {
    isError: false,
    data: {},
    code: 200,
  };
};

export default ListTasks;
