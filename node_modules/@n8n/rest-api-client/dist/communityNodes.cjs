const require_utils = require('./utils2.cjs');
let __n8n_constants = require("@n8n/constants");

//#region src/api/communityNodes.ts
async function getInstalledCommunityNodes(context) {
	return (await require_utils.get(context.baseUrl, "/community-packages")).data || [];
}
async function installNewPackage(context, name, verify, version) {
	return await require_utils.post(context.baseUrl, "/community-packages", {
		name,
		verify,
		version
	});
}
async function uninstallPackage(context, name) {
	return await require_utils.makeRestApiRequest(context, "DELETE", "/community-packages", { name });
}
async function updatePackage(context, name, version, checksum) {
	return await require_utils.makeRestApiRequest(context, "PATCH", "/community-packages", {
		name,
		version,
		checksum
	});
}
async function getAvailableCommunityPackageCount() {
	return (await require_utils.get(__n8n_constants.NPM_COMMUNITY_NODE_SEARCH_API_URL, "search?q=keywords:n8n-community-node-package")).total || 0;
}

//#endregion
Object.defineProperty(exports, 'getAvailableCommunityPackageCount', {
  enumerable: true,
  get: function () {
    return getAvailableCommunityPackageCount;
  }
});
Object.defineProperty(exports, 'getInstalledCommunityNodes', {
  enumerable: true,
  get: function () {
    return getInstalledCommunityNodes;
  }
});
Object.defineProperty(exports, 'installNewPackage', {
  enumerable: true,
  get: function () {
    return installNewPackage;
  }
});
Object.defineProperty(exports, 'uninstallPackage', {
  enumerable: true,
  get: function () {
    return uninstallPackage;
  }
});
Object.defineProperty(exports, 'updatePackage', {
  enumerable: true,
  get: function () {
    return updatePackage;
  }
});
//# sourceMappingURL=communityNodes.cjs.map