const require_utils = require('../utils2.cjs');

//#region src/api/dynamic-banners.ts
async function getDynamicBanners(endpoint, filters) {
	return await require_utils.get(endpoint, "", filters);
}

//#endregion
exports.getDynamicBanners = getDynamicBanners;
//# sourceMappingURL=dynamic-banners.cjs.map