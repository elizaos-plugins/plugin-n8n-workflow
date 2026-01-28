require('../utils2.cjs');
const require_eventbus_ee = require('../eventbus.ee.cjs');

exports.deleteDestinationFromDb = require_eventbus_ee.deleteDestinationFromDb;
exports.getDestinationsFromBackend = require_eventbus_ee.getDestinationsFromBackend;
exports.getEventNamesFromBackend = require_eventbus_ee.getEventNamesFromBackend;
exports.hasDestinationId = require_eventbus_ee.hasDestinationId;
exports.saveDestinationToDb = require_eventbus_ee.saveDestinationToDb;
exports.sendTestMessageToDestination = require_eventbus_ee.sendTestMessageToDestination;