const require_utils = require('./utils2.cjs');

//#region src/api/ctas.ts
async function getBecomeCreatorCta(context) {
	return await require_utils.get(context.baseUrl, "/cta/become-creator");
}

//#endregion
Object.defineProperty(exports, 'getBecomeCreatorCta', {
  enumerable: true,
  get: function () {
    return getBecomeCreatorCta;
  }
});
//# sourceMappingURL=ctas.cjs.map