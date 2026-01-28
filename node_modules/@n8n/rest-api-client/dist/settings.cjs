const require_utils = require('./utils2.cjs');

//#region src/api/settings.ts
async function getSettings(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/settings");
}

//#endregion
Object.defineProperty(exports, 'getSettings', {
  enumerable: true,
  get: function () {
    return getSettings;
  }
});
//# sourceMappingURL=settings.cjs.map