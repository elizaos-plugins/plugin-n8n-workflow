import { a as get } from "./utils2.mjs";
import { INSTANCE_ID_HEADER, INSTANCE_VERSION_HEADER } from "@n8n/constants";

//#region src/api/versions.ts
async function getNextVersions(endpoint, currentVersion, instanceId) {
	return await get(endpoint, currentVersion, {}, { [INSTANCE_ID_HEADER]: instanceId });
}
async function getWhatsNewSection(endpoint, currentVersion, instanceId) {
	return await get(endpoint, "", {}, {
		[INSTANCE_ID_HEADER]: instanceId,
		[INSTANCE_VERSION_HEADER]: currentVersion
	});
}

//#endregion
export { getWhatsNewSection as n, getNextVersions as t };
//# sourceMappingURL=versions.mjs.map