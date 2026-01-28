const require_utils = require('./utils2.cjs');
let axios = require("axios");
axios = require_utils.__toESM(axios);
let n8n_workflow = require("n8n-workflow");

//#region src/api/nodeTypes.ts
async function fetchNodeTypesJsonWithRetry(url, retries = 5, delay = 500) {
	for (let attempt = 0; attempt < retries; attempt++) {
		const response = await axios.default.get(url, { withCredentials: true });
		if (typeof response.data === "object" && response.data !== null) return response.data;
		await (0, n8n_workflow.sleep)(delay * attempt);
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
	return await require_utils.makeRestApiRequest(context, "POST", "/node-types/by-identifier", { identifiers });
}
async function fetchCommunityNodeTypes(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/community-node-types");
}
async function fetchCommunityNodeAttributes(context, type) {
	return await require_utils.makeRestApiRequest(context, "GET", `/community-node-types/${encodeURIComponent(type)}`);
}
async function getNodeTranslationHeaders(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/node-translation-headers");
}
async function getNodesInformation(context, nodeInfos) {
	return await require_utils.makeRestApiRequest(context, "POST", "/node-types", { nodeInfos });
}
async function getNodeParameterOptions(context, sendData) {
	return await require_utils.makeRestApiRequest(context, "POST", "/dynamic-node-parameters/options", sendData);
}
async function getResourceLocatorResults(context, sendData) {
	return await require_utils.makeRestApiRequest(context, "POST", "/dynamic-node-parameters/resource-locator-results", sendData);
}
async function getResourceMapperFields(context, sendData) {
	return await require_utils.makeRestApiRequest(context, "POST", "/dynamic-node-parameters/resource-mapper-fields", sendData);
}
async function getLocalResourceMapperFields(context, sendData) {
	return await require_utils.makeRestApiRequest(context, "POST", "/dynamic-node-parameters/local-resource-mapper-fields", sendData);
}
async function getNodeParameterActionResult(context, sendData) {
	return await require_utils.makeRestApiRequest(context, "POST", "/dynamic-node-parameters/action-result", sendData);
}

//#endregion
Object.defineProperty(exports, 'fetchCommunityNodeAttributes', {
  enumerable: true,
  get: function () {
    return fetchCommunityNodeAttributes;
  }
});
Object.defineProperty(exports, 'fetchCommunityNodeTypes', {
  enumerable: true,
  get: function () {
    return fetchCommunityNodeTypes;
  }
});
Object.defineProperty(exports, 'getLocalResourceMapperFields', {
  enumerable: true,
  get: function () {
    return getLocalResourceMapperFields;
  }
});
Object.defineProperty(exports, 'getNodeParameterActionResult', {
  enumerable: true,
  get: function () {
    return getNodeParameterActionResult;
  }
});
Object.defineProperty(exports, 'getNodeParameterOptions', {
  enumerable: true,
  get: function () {
    return getNodeParameterOptions;
  }
});
Object.defineProperty(exports, 'getNodeTranslationHeaders', {
  enumerable: true,
  get: function () {
    return getNodeTranslationHeaders;
  }
});
Object.defineProperty(exports, 'getNodeTypeVersions', {
  enumerable: true,
  get: function () {
    return getNodeTypeVersions;
  }
});
Object.defineProperty(exports, 'getNodeTypes', {
  enumerable: true,
  get: function () {
    return getNodeTypes;
  }
});
Object.defineProperty(exports, 'getNodeTypesByIdentifier', {
  enumerable: true,
  get: function () {
    return getNodeTypesByIdentifier;
  }
});
Object.defineProperty(exports, 'getNodesInformation', {
  enumerable: true,
  get: function () {
    return getNodesInformation;
  }
});
Object.defineProperty(exports, 'getResourceLocatorResults', {
  enumerable: true,
  get: function () {
    return getResourceLocatorResults;
  }
});
Object.defineProperty(exports, 'getResourceMapperFields', {
  enumerable: true,
  get: function () {
    return getResourceMapperFields;
  }
});
//# sourceMappingURL=nodeTypes.cjs.map