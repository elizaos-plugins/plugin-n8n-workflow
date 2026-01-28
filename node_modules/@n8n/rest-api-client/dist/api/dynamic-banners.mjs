import { a as get } from "../utils2.mjs";

//#region src/api/dynamic-banners.ts
async function getDynamicBanners(endpoint, filters) {
	return await get(endpoint, "", filters);
}

//#endregion
export { getDynamicBanners };
//# sourceMappingURL=dynamic-banners.mjs.map