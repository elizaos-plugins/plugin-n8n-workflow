import { a as get } from "./utils2.mjs";

//#region src/api/templates.ts
function stringifyArray(arr) {
	return arr.join(",");
}
async function testHealthEndpoint(apiEndpoint) {
	return await get(apiEndpoint, "/health");
}
async function getCategories(apiEndpoint, headers) {
	return await get(apiEndpoint, "/templates/categories", void 0, headers);
}
async function getCollections(apiEndpoint, query, headers) {
	return await get(apiEndpoint, "/templates/collections", {
		category: query.categories,
		search: query.search
	}, headers);
}
async function getWorkflows(apiEndpoint, query, headers) {
	const { apps, sort, combineWith, categories, nodes, ...restQuery } = query;
	return await get(apiEndpoint, "/templates/search", {
		...restQuery,
		category: stringifyArray(categories),
		...apps && { apps: stringifyArray(apps) },
		...nodes && { nodes: stringifyArray(nodes) },
		...sort && { sort },
		...combineWith && { combineWith }
	}, headers);
}
async function getCollectionById(apiEndpoint, collectionId, headers) {
	return await get(apiEndpoint, `/templates/collections/${collectionId}`, void 0, headers);
}
async function getTemplateById(apiEndpoint, templateId, headers) {
	return await get(apiEndpoint, `/templates/workflows/${templateId}`, void 0, headers);
}
async function getWorkflowTemplate(apiEndpoint, templateId, headers) {
	return await get(apiEndpoint, `/workflows/templates/${templateId}`, void 0, headers);
}

//#endregion
export { getWorkflowTemplate as a, getTemplateById as i, getCollectionById as n, getWorkflows as o, getCollections as r, testHealthEndpoint as s, getCategories as t };
//# sourceMappingURL=templates.mjs.map