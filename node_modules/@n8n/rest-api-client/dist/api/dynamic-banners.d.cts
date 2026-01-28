import { BannerName } from "@n8n/api-types";
import { Role as Role$1 } from "@n8n/api-types/dist/schemas/user.schema";

//#region src/api/dynamic-banners.d.ts
type DynamicBanner = {
  id: BannerName;
  content: string;
  isDismissible: boolean;
  dismissPermanently: boolean | null;
  theme: 'info' | 'warning' | 'danger';
  priority: number;
};
type DynamicBannerFilters = {
  version: string;
  deploymentType: string;
  planName?: string;
  instanceId: string;
  userCreatedAt?: string;
  isOwner?: boolean;
  role?: Role$1;
};
declare function getDynamicBanners(endpoint: string, filters: DynamicBannerFilters): Promise<DynamicBanner[]>;
//#endregion
export { DynamicBanner, getDynamicBanners };
//# sourceMappingURL=dynamic-banners.d.cts.map