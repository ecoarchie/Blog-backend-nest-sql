import { PaginationView } from '../../common_models/pagination-view.model';
import { BlogPublicViewModel } from './blog-public-view.model';

export class BlogsPagination extends PaginationView {
  items: BlogPublicViewModel[];
}
