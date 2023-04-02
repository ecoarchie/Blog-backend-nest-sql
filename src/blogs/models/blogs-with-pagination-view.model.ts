import { PaginationView } from '../../common_models/pagination-view.model';
import { BlogPost } from '../../posts/entities/blogpost.entity';

export class BlogsPagination extends PaginationView {
  items: Omit<BlogPost, 'ownerId' | 'isBanned' | 'banDate'>;
}
