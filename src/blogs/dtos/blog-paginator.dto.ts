import { Transform, TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';
import { Pagination } from 'src/users/dtos/paginator';
import { SortDirection } from 'src/users/dtos/users-paginator';
import { Blog } from '../entities/blog.entity';

export class BlogsPaginator {
  @IsString()
  @IsOptional()
  sortBy: string = 'createdAt';

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortDirection: SortDirection = 'desc';

  @IsPositive()
  @Transform(({ value }: TransformFnParams) => Number(value))
  @IsOptional()
  pageNumber: number = 1;

  @IsPositive()
  @Transform(({ value }: TransformFnParams) => Number(value))
  @IsOptional()
  pageSize: number = 10;

  @IsString()
  @IsOptional()
  searchNameTerm: string | null = null;
}

export interface BlogsPagination extends Pagination {
  items: Partial<Blog>[];
}
