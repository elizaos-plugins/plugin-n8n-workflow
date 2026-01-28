const require_utils = require('./utils2.cjs');

//#region src/api/ldap.ts
async function getLdapConfig(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/ldap/config");
}
async function testLdapConnection(context) {
	return await require_utils.makeRestApiRequest(context, "POST", "/ldap/test-connection");
}
async function updateLdapConfig(context, adConfig) {
	return await require_utils.makeRestApiRequest(context, "PUT", "/ldap/config", adConfig);
}
async function runLdapSync(context, data) {
	return await require_utils.makeRestApiRequest(context, "POST", "/ldap/sync", data);
}
async function getLdapSynchronizations(context, pagination) {
	return await require_utils.makeRestApiRequest(context, "GET", "/ldap/sync", pagination);
}

//#endregion
Object.defineProperty(exports, 'getLdapConfig', {
  enumerable: true,
  get: function () {
    return getLdapConfig;
  }
});
Object.defineProperty(exports, 'getLdapSynchronizations', {
  enumerable: true,
  get: function () {
    return getLdapSynchronizations;
  }
});
Object.defineProperty(exports, 'runLdapSync', {
  enumerable: true,
  get: function () {
    return runLdapSync;
  }
});
Object.defineProperty(exports, 'testLdapConnection', {
  enumerable: true,
  get: function () {
    return testLdapConnection;
  }
});
Object.defineProperty(exports, 'updateLdapConfig', {
  enumerable: true,
  get: function () {
    return updateLdapConfig;
  }
});
//# sourceMappingURL=ldap.cjs.map