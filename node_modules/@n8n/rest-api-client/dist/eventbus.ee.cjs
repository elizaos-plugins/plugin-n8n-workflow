const require_utils = require('./utils2.cjs');

//#region src/api/eventbus.ee.ts
function hasDestinationId(destination) {
	return destination.id !== void 0;
}
async function saveDestinationToDb(context, destination, subscribedEvents = []) {
	return await require_utils.makeRestApiRequest(context, "POST", "/eventbus/destination", {
		...destination,
		subscribedEvents
	});
}
async function deleteDestinationFromDb(context, destinationId) {
	return await require_utils.makeRestApiRequest(context, "DELETE", `/eventbus/destination?id=${destinationId}`);
}
async function sendTestMessageToDestination(context, destination) {
	return await require_utils.makeRestApiRequest(context, "GET", "/eventbus/testmessage", { ...destination });
}
async function getEventNamesFromBackend(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/eventbus/eventnames");
}
async function getDestinationsFromBackend(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/eventbus/destination");
}

//#endregion
Object.defineProperty(exports, 'deleteDestinationFromDb', {
  enumerable: true,
  get: function () {
    return deleteDestinationFromDb;
  }
});
Object.defineProperty(exports, 'getDestinationsFromBackend', {
  enumerable: true,
  get: function () {
    return getDestinationsFromBackend;
  }
});
Object.defineProperty(exports, 'getEventNamesFromBackend', {
  enumerable: true,
  get: function () {
    return getEventNamesFromBackend;
  }
});
Object.defineProperty(exports, 'hasDestinationId', {
  enumerable: true,
  get: function () {
    return hasDestinationId;
  }
});
Object.defineProperty(exports, 'saveDestinationToDb', {
  enumerable: true,
  get: function () {
    return saveDestinationToDb;
  }
});
Object.defineProperty(exports, 'sendTestMessageToDestination', {
  enumerable: true,
  get: function () {
    return sendTestMessageToDestination;
  }
});
//# sourceMappingURL=eventbus.ee.cjs.map