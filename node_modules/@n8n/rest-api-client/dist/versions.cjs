const require_utils = require('./utils2.cjs');
let __n8n_constants = require("@n8n/constants");

//#region src/api/versions.ts
async function getNextVersions(endpoint, currentVersion, instanceId) {
	return await require_utils.get(endpoint, currentVersion, {}, { [__n8n_constants.INSTANCE_ID_HEADER]: instanceId });
}
async function getWhatsNewSection(endpoint, currentVersion, instanceId) {
	return await require_utils.get(endpoint, "", {}, {
		[__n8n_constants.INSTANCE_ID_HEADER]: instanceId,
		[__n8n_constants.INSTANCE_VERSION_HEADER]: currentVersion
	});
}

//#endregion
Object.defineProperty(exports, 'getNextVersions', {
  enumerable: true,
  get: function () {
    return getNextVersions;
  }
});
Object.defineProperty(exports, 'getWhatsNewSection', {
  enumerable: true,
  get: function () {
    return getWhatsNewSection;
  }
});
//# sourceMappingURL=versions.cjs.map