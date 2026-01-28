const require_utils = require('./utils2.cjs');

//#region src/api/templates.ts
function stringifyArray(arr) {
	return arr.join(",");
}
async function testHealthEndpoint(apiEndpoint) {
	return await require_utils.get(apiEndpoint, "/health");
}
async function getCategories(apiEndpoint, headers) {
	return await require_utils.get(apiEndpoint, "/templates/categories", void 0, headers);
}
async function getCollections(apiEndpoint, query, headers) {
	return await require_utils.get(apiEndpoint, "/templates/collections", {
		category: query.categories,
		search: query.search
	}, headers);
}
async function getWorkflows(apiEndpoint, query, headers) {
	const { apps, sort, combineWith, categories, nodes, ...restQuery } = query;
	return await require_utils.get(apiEndpoint, "/templates/search", {
		...restQuery,
		category: stringifyArray(categories),
		...apps && { apps: stringifyArray(apps) },
		...nodes && { nodes: stringifyArray(nodes) },
		...sort && { sort },
		...combineWith && { combineWith }
	}, headers);
}
async function getCollectionById(apiEndpoint, collectionId, headers) {
	return await require_utils.get(apiEndpoint, `/templates/collections/${collectionId}`, void 0, headers);
}
async function getTemplateById(apiEndpoint, templateId, headers) {
	return await require_utils.get(apiEndpoint, `/templates/workflows/${templateId}`, void 0, headers);
}
async function getWorkflowTemplate(apiEndpoint, templateId, headers) {
	return await require_utils.get(apiEndpoint, `/workflows/templates/${templateId}`, void 0, headers);
}

//#endregion
Object.defineProperty(exports, 'getCategories', {
  enumerable: true,
  get: function () {
    return getCategories;
  }
});
Object.defineProperty(exports, 'getCollectionById', {
  enumerable: true,
  get: function () {
    return getCollectionById;
  }
});
Object.defineProperty(exports, 'getCollections', {
  enumerable: true,
  get: function () {
    return getCollections;
  }
});
Object.defineProperty(exports, 'getTemplateById', {
  enumerable: true,
  get: function () {
    return getTemplateById;
  }
});
Object.defineProperty(exports, 'getWorkflowTemplate', {
  enumerable: true,
  get: function () {
    return getWorkflowTemplate;
  }
});
Object.defineProperty(exports, 'getWorkflows', {
  enumerable: true,
  get: function () {
    return getWorkflows;
  }
});
Object.defineProperty(exports, 'testHealthEndpoint', {
  enumerable: true,
  get: function () {
    return testHealthEndpoint;
  }
});
//# sourceMappingURL=templates.cjs.map