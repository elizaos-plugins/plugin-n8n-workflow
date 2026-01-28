import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/orchestration.ts
const GET_STATUS_ENDPOINT = "/orchestration/worker/status";
const sendGetWorkerStatus = async (context) => {
	await makeRestApiRequest(context, "POST", GET_STATUS_ENDPOINT);
};

//#endregion
export { sendGetWorkerStatus as t };
//# sourceMappingURL=orchestration.mjs.map