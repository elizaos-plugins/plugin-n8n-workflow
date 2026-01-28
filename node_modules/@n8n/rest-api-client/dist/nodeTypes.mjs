import { s as makeRestApiRequest } from "./utils2.mjs";
import axios from "axios";
import { sleep } from "n8n-workflow";

//#region src/api/nodeTypes.ts
async function fetchNodeTypesJsonWithRetry(url, retries = 5, delay = 500) {
	for (let attempt = 0; attempt < retries; attempt++) {
		const response = await axios.get(url, { withCredentials: true });
		if (typeof response.data === "object" && response.data !== null) return response.data;
		await sleep(delay * attempt);
	}
	throw new Error("Could not fetch node types");
}
async function getNodeTypes(baseUrl) {
	return await fetchNodeTypesJsonWithRetry(baseUrl + "types/nodes.json");
}
async function getNodeTypeVersions(baseUrl) {
	return await fetchNodeTypesJsonWithRetry(baseUrl + "types/node-versions.json");
}
/**
* Fetch specific node types by their identifier (name@version format)
* This is useful for incremental syncs where only missing node types need to be fetched
*
* @param context - The REST API context containing base URL and auth info
* @param identifiers - Array of node type identifiers in "name@version" format
* @returns Array of node type descriptions for the requested identifiers
*/
async function getNodeTypesByIdentifier(context, identifiers) {
	return await makeRestApiRequest(context, "POST", "/node-types/by-identifier", { identifiers });
}
async function fetchCommunityNodeTypes(context) {
	return await makeRestApiRequest(context, "GET", "/community-node-types");
}
async function fetchCommunityNodeAttributes(context, type) {
	return await makeRestApiRequest(context, "GET", `/community-node-types/${encodeURIComponent(type)}`);
}
async function getNodeTranslationHeaders(context) {
	return await makeRestApiRequest(context, "GET", "/node-translation-headers");
}
async function getNodesInformation(context, nodeInfos) {
	return await makeRestApiRequest(context, "POST", "/node-types", { nodeInfos });
}
async function getNodeParameterOptions(context, sendData) {
	return await makeRestApiRequest(context, "POST", "/dynamic-node-parameters/options", sendData);
}
async function getResourceLocatorResults(context, sendData) {
	return await makeRestApiRequest(context, "POST", "/dynamic-node-parameters/resource-locator-results", sendData);
}
async function getResourceMapperFields(context, sendData) {
	return await makeRestApiRequest(context, "POST", "/dynamic-node-parameters/resource-mapper-fields", sendData);
}
async function getLocalResourceMapperFields(context, sendData) {
	return await makeRestApiRequest(context, "POST", "/dynamic-node-parameters/local-resource-mapper-fields", sendData);
}
async function getNodeParameterActionResult(context, sendData) {
	return await makeRestApiRequest(context, "POST", "/dynamic-node-parameters/action-result", sendData);
}

//#endregion
export { getNodeParameterOptions as a, getNodeTypes as c, getResourceLocatorResults as d, getResourceMapperFields as f, getNodeParameterActionResult as i, getNodeTypesByIdentifier as l, fetchCommunityNodeTypes as n, getNodeTranslationHeaders as o, getLocalResourceMapperFields as r, getNodeTypeVersions as s, fetchCommunityNodeAttributes as t, getNodesInformation as u };
//# sourceMappingURL=nodeTypes.mjs.map