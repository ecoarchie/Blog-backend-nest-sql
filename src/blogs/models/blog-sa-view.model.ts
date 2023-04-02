import { BlogPublicViewModel } from './blog-public-view.model';
import { BlogOwnerInfo } from './blog -owner-info.model';
import { BanInfo } from './ban-info.model';

export type BlogSaViewModel = BlogPublicViewModel & {
  blogOwnerInfo: BlogOwnerInfo;
  banInfo: BanInfo;
};
