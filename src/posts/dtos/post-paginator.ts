import { Transform, TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';
import { Pagination } from 'src/users/dtos/paginator';
import { SortDirection } from 'src/users/dtos/users-paginator';
import { BlogPost } from '../entities/blogpost.entity';

export class PostPaginator {
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

export interface PostsPagination extends Pagination {
  items: Partial<BlogPost>[];
}
