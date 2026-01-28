const require_utils = require('./utils2.cjs');

//#region src/api/api-keys.ts
async function getApiKeys(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/api-keys");
}
async function getApiKeyScopes(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/api-keys/scopes");
}
async function createApiKey(context, payload) {
	return await require_utils.makeRestApiRequest(context, "POST", "/api-keys", payload);
}
async function deleteApiKey(context, id) {
	return await require_utils.makeRestApiRequest(context, "DELETE", `/api-keys/${id}`);
}
async function updateApiKey(context, id, payload) {
	return await require_utils.makeRestApiRequest(context, "PATCH", `/api-keys/${id}`, payload);
}

//#endregion
Object.defineProperty(exports, 'createApiKey', {
  enumerable: true,
  get: function () {
    return createApiKey;
  }
});
Object.defineProperty(exports, 'deleteApiKey', {
  enumerable: true,
  get: function () {
    return deleteApiKey;
  }
});
Object.defineProperty(exports, 'getApiKeyScopes', {
  enumerable: true,
  get: function () {
    return getApiKeyScopes;
  }
});
Object.defineProperty(exports, 'getApiKeys', {
  enumerable: true,
  get: function () {
    return getApiKeys;
  }
});
Object.defineProperty(exports, 'updateApiKey', {
  enumerable: true,
  get: function () {
    return updateApiKey;
  }
});
//# sourceMappingURL=api-keys.cjs.map