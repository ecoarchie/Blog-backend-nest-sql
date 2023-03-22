import { Transform, TransformFnParams } from "class-transformer";
import { IsIn, IsOptional, IsPositive, IsString } from "class-validator";
import { SortDirection, UserPaginator } from "./users-paginator";

export class BannedUsersPaginator {
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
  searchLoginTerm: string = null;
}
