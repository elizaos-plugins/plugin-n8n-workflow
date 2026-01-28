const require_utils = require('../utils2.cjs');

//#region src/api/breaking-changes.ts
async function getReport(context, query) {
	return (await require_utils.get(context.baseUrl, "/breaking-changes/report", query)).data;
}
async function refreshReport(context, query) {
	return await require_utils.makeRestApiRequest(context, "POST", query?.version ? `/breaking-changes/report/refresh?version=${query.version}` : "/breaking-changes/report/refresh");
}
async function getReportForRule(context, ruleId) {
	return (await require_utils.get(context.baseUrl, `/breaking-changes/report/${ruleId}`)).data;
}

//#endregion
exports.getReport = getReport;
exports.getReportForRule = getReportForRule;
exports.refreshReport = refreshReport;
//# sourceMappingURL=breaking-changes.cjs.map