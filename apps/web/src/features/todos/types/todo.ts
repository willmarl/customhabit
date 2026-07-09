export type Todo = {
  id: number;
  title: string;
  done: boolean;
};

export type TodoCreate = {
  title: string;
  done?: boolean;
};

export type TodoUpdate = {
  title?: string;
  done?: boolean;
};
