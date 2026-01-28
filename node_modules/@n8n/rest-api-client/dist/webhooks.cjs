const require_utils = require('./utils2.cjs');

//#region src/api/webhooks.ts
const findWebhook = async (context, data) => {
	return await require_utils.makeRestApiRequest(context, "POST", "/webhooks/find", data);
};

//#endregion
Object.defineProperty(exports, 'findWebhook', {
  enumerable: true,
  get: function () {
    return findWebhook;
  }
});
//# sourceMappingURL=webhooks.cjs.map