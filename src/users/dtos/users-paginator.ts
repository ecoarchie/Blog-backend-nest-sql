import { Transform, TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';

export type SortDirection = 'asc' | 'desc';

type BanStatus = 'all' | 'banned' | 'notBanned';

export class UserPaginator {
  @IsIn(['all', 'banned', 'notBanned'])
  @IsOptional()
  banStatus: BanStatus = 'all';

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
  searchLoginTerm: string | null = null;

  @IsString()
  @IsOptional()
  searchEmailTerm: string | null = null;
}
