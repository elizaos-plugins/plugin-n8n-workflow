const require_utils = require('./utils2.cjs');

//#region src/api/provisioning.ts
const getProvisioningConfig = async (context) => {
	return await require_utils.makeRestApiRequest(context, "GET", "/sso/provisioning/config");
};
const saveProvisioningConfig = async (context, config) => {
	return await require_utils.makeRestApiRequest(context, "PATCH", "/sso/provisioning/config", config);
};

//#endregion
Object.defineProperty(exports, 'getProvisioningConfig', {
  enumerable: true,
  get: function () {
    return getProvisioningConfig;
  }
});
Object.defineProperty(exports, 'saveProvisioningConfig', {
  enumerable: true,
  get: function () {
    return saveProvisioningConfig;
  }
});
//# sourceMappingURL=provisioning.cjs.map