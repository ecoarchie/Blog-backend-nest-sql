import { Transform, TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';
import { Pagination } from '../../users/dtos/paginator';
import { SortDirection } from '../../users/dtos/users-paginator';

export class CommentPaginator {
  @IsString()
  @IsOptional()
  sortBy = 'createdAt';

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortDirection: SortDirection = 'desc';

  @IsPositive()
  @Transform(({ value }: TransformFnParams) => Number(value))
  @IsOptional()
  pageNumber = 1;

  @IsPositive()
  @Transform(({ value }: TransformFnParams) => Number(value))
  @IsOptional()
  pageSize = 10;
}

export interface CommentPagination extends Pagination {
  items: Partial<Comment>[];
}
