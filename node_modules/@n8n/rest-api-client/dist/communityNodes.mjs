import { a as get, l as post, s as makeRestApiRequest } from "./utils2.mjs";
import { NPM_COMMUNITY_NODE_SEARCH_API_URL } from "@n8n/constants";

//#region src/api/communityNodes.ts
async function getInstalledCommunityNodes(context) {
	return (await get(context.baseUrl, "/community-packages")).data || [];
}
async function installNewPackage(context, name, verify, version) {
	return await post(context.baseUrl, "/community-packages", {
		name,
		verify,
		version
	});
}
async function uninstallPackage(context, name) {
	return await makeRestApiRequest(context, "DELETE", "/community-packages", { name });
}
async function updatePackage(context, name, version, checksum) {
	return await makeRestApiRequest(context, "PATCH", "/community-packages", {
		name,
		version,
		checksum
	});
}
async function getAvailableCommunityPackageCount() {
	return (await get(NPM_COMMUNITY_NODE_SEARCH_API_URL, "search?q=keywords:n8n-community-node-package")).total || 0;
}

//#endregion
export { updatePackage as a, uninstallPackage as i, getInstalledCommunityNodes as n, installNewPackage as r, getAvailableCommunityPackageCount as t };
//# sourceMappingURL=communityNodes.mjs.map