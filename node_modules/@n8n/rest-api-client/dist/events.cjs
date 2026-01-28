const require_utils = require('./utils2.cjs');

//#region src/api/events.ts
async function sessionStarted(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/events/session-started");
}

//#endregion
Object.defineProperty(exports, 'sessionStarted', {
  enumerable: true,
  get: function () {
    return sessionStarted;
  }
});
//# sourceMappingURL=events.cjs.map