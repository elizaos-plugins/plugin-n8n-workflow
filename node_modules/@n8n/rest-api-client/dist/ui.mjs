import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/ui.ts
async function dismissBannerPermanently(context, data) {
	return await makeRestApiRequest(context, "POST", "/owner/dismiss-banner", { banner: data.bannerName });
}

//#endregion
export { dismissBannerPermanently as t };
//# sourceMappingURL=ui.mjs.map