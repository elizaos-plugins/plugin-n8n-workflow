import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/eventbus.ee.ts
function hasDestinationId(destination) {
	return destination.id !== void 0;
}
async function saveDestinationToDb(context, destination, subscribedEvents = []) {
	return await makeRestApiRequest(context, "POST", "/eventbus/destination", {
		...destination,
		subscribedEvents
	});
}
async function deleteDestinationFromDb(context, destinationId) {
	return await makeRestApiRequest(context, "DELETE", `/eventbus/destination?id=${destinationId}`);
}
async function sendTestMessageToDestination(context, destination) {
	return await makeRestApiRequest(context, "GET", "/eventbus/testmessage", { ...destination });
}
async function getEventNamesFromBackend(context) {
	return await makeRestApiRequest(context, "GET", "/eventbus/eventnames");
}
async function getDestinationsFromBackend(context) {
	return await makeRestApiRequest(context, "GET", "/eventbus/destination");
}

//#endregion
export { saveDestinationToDb as a, hasDestinationId as i, getDestinationsFromBackend as n, sendTestMessageToDestination as o, getEventNamesFromBackend as r, deleteDestinationFromDb as t };
//# sourceMappingURL=eventbus.ee.mjs.map