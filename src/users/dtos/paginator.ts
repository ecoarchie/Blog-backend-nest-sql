import { User } from "../entities/user.entity";

export interface Pagination {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface UsersPagination extends Pagination {
  items: Partial<User>[];
}

