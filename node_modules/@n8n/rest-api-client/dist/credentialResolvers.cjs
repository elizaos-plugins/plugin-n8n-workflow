const require_utils = require('./utils2.cjs');

//#region src/api/credentialResolvers.ts
async function getCredentialResolvers(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/credential-resolvers");
}
async function getCredentialResolverTypes(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/credential-resolvers/types");
}
async function getCredentialResolver(context, resolverId) {
	return await require_utils.makeRestApiRequest(context, "GET", `/credential-resolvers/${resolverId}`);
}
async function createCredentialResolver(context, payload) {
	return await require_utils.makeRestApiRequest(context, "POST", "/credential-resolvers", payload);
}
async function updateCredentialResolver(context, resolverId, payload) {
	return await require_utils.makeRestApiRequest(context, "PATCH", `/credential-resolvers/${resolverId}`, payload);
}
async function deleteCredentialResolver(context, resolverId) {
	return await require_utils.makeRestApiRequest(context, "DELETE", `/credential-resolvers/${resolverId}`);
}

//#endregion
Object.defineProperty(exports, 'createCredentialResolver', {
  enumerable: true,
  get: function () {
    return createCredentialResolver;
  }
});
Object.defineProperty(exports, 'deleteCredentialResolver', {
  enumerable: true,
  get: function () {
    return deleteCredentialResolver;
  }
});
Object.defineProperty(exports, 'getCredentialResolver', {
  enumerable: true,
  get: function () {
    return getCredentialResolver;
  }
});
Object.defineProperty(exports, 'getCredentialResolverTypes', {
  enumerable: true,
  get: function () {
    return getCredentialResolverTypes;
  }
});
Object.defineProperty(exports, 'getCredentialResolvers', {
  enumerable: true,
  get: function () {
    return getCredentialResolvers;
  }
});
Object.defineProperty(exports, 'updateCredentialResolver', {
  enumerable: true,
  get: function () {
    return updateCredentialResolver;
  }
});
//# sourceMappingURL=credentialResolvers.cjs.map