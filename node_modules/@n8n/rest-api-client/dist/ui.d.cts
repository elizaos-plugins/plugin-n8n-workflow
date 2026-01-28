import { t as IRestApiContext } from "./types2.cjs";
import { BannerName } from "@n8n/api-types";

//#region src/api/ui.d.ts
declare function dismissBannerPermanently(context: IRestApiContext, data: {
  bannerName: BannerName;
  dismissedBanners: string[];
}): Promise<void>;
//#endregion
export { dismissBannerPermanently as t };
//# sourceMappingURL=ui.d.cts.map