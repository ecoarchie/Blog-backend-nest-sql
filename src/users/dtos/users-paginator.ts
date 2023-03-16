type SortDirection = 'asc' | 'desc';

type BanStatus = 'all' | 'banned' | 'notBanned';

export class UserPaginatorOptions {
  public banStatus: BanStatus;
  public sortBy: string;
  public sortDirection: SortDirection;
  public pageNumber: number;
  public pageSize: number;
  public searchLoginTerm: string;
  public searchEmailTerm: string;
  public skip: number;

  constructor(data: Partial<UserPaginatorOptions> = {}) {
    this.banStatus = data.banStatus || 'all';
    this.sortBy = data.sortBy || 'createdAt';
    this.sortDirection = data.sortDirection || 'desc';
    this.pageNumber = Number(data.pageNumber) || 1;
    this.pageSize = Number(data.pageSize) || 10;
    this.searchLoginTerm = data.searchLoginTerm || null;
    this.searchEmailTerm = data.searchEmailTerm || null;
    this.skip = (this.pageNumber - 1) * this.pageSize;
  }
}
