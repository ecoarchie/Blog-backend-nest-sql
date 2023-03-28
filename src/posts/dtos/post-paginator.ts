import { Transform, TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';
import { Pagination } from '../../users/dtos/paginator';
import { SortDirection } from '../../users/dtos/users-paginator';
import { BlogPost } from '../entities/blogpost.entity';

export class PostPaginator {
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

  @IsString()
  @IsOptional()
  searchNameTerm: string | null = null;
}

export interface PostsPagination extends Pagination {
  items: Partial<BlogPost>[];
}
