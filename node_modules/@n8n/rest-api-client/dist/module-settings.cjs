const require_utils = require('./utils2.cjs');

//#region src/api/module-settings.ts
async function getModuleSettings(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/module-settings");
}

//#endregion
Object.defineProperty(exports, 'getModuleSettings', {
  enumerable: true,
  get: function () {
    return getModuleSettings;
  }
});
//# sourceMappingURL=module-settings.cjs.map