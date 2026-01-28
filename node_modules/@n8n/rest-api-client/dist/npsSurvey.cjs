const require_utils = require('./utils2.cjs');

//#region src/api/npsSurvey.ts
async function updateNpsSurveyState(context, state) {
	await require_utils.makeRestApiRequest(context, "PATCH", "/user-settings/nps-survey", state);
}

//#endregion
Object.defineProperty(exports, 'updateNpsSurveyState', {
  enumerable: true,
  get: function () {
    return updateNpsSurveyState;
  }
});
//# sourceMappingURL=npsSurvey.cjs.map