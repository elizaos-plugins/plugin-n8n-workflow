const require_utils = require('./utils2.cjs');

//#region src/api/usage.ts
const getLicense = async (context) => {
	return await require_utils.makeRestApiRequest(context, "GET", "/license");
};
const activateLicenseKey = async (context, data) => {
	return await require_utils.makeRestApiRequest(context, "POST", "/license/activate", data);
};
const renewLicense = async (context) => {
	return await require_utils.makeRestApiRequest(context, "POST", "/license/renew");
};
const requestLicenseTrial = async (context) => {
	return await require_utils.makeRestApiRequest(context, "POST", "/license/enterprise/request_trial");
};
const registerCommunityEdition = async (context, params) => {
	return await require_utils.makeRestApiRequest(context, "POST", "/license/enterprise/community-registered", params);
};

//#endregion
Object.defineProperty(exports, 'activateLicenseKey', {
  enumerable: true,
  get: function () {
    return activateLicenseKey;
  }
});
Object.defineProperty(exports, 'getLicense', {
  enumerable: true,
  get: function () {
    return getLicense;
  }
});
Object.defineProperty(exports, 'registerCommunityEdition', {
  enumerable: true,
  get: function () {
    return registerCommunityEdition;
  }
});
Object.defineProperty(exports, 'renewLicense', {
  enumerable: true,
  get: function () {
    return renewLicense;
  }
});
Object.defineProperty(exports, 'requestLicenseTrial', {
  enumerable: true,
  get: function () {
    return requestLicenseTrial;
  }
});
//# sourceMappingURL=usage.cjs.map