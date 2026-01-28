const require_utils = require('./utils2.cjs');

//#region src/api/orchestration.ts
const GET_STATUS_ENDPOINT = "/orchestration/worker/status";
const sendGetWorkerStatus = async (context) => {
	await require_utils.makeRestApiRequest(context, "POST", GET_STATUS_ENDPOINT);
};

//#endregion
Object.defineProperty(exports, 'sendGetWorkerStatus', {
  enumerable: true,
  get: function () {
    return sendGetWorkerStatus;
  }
});
//# sourceMappingURL=orchestration.cjs.map