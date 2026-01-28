const require_utils = require('./utils2.cjs');

//#region src/api/ui.ts
async function dismissBannerPermanently(context, data) {
	return await require_utils.makeRestApiRequest(context, "POST", "/owner/dismiss-banner", { banner: data.bannerName });
}

//#endregion
Object.defineProperty(exports, 'dismissBannerPermanently', {
  enumerable: true,
  get: function () {
    return dismissBannerPermanently;
  }
});
//# sourceMappingURL=ui.cjs.map