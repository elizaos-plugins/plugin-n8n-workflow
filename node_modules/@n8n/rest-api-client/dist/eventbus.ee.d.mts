import { t as IRestApiContext } from "./types2.mjs";
import { MessageEventBusDestinationOptions } from "n8n-workflow";

//#region src/api/eventbus.ee.d.ts
type ApiMessageEventBusDestinationOptions = MessageEventBusDestinationOptions & {
  id: string;
};
declare function hasDestinationId(destination: MessageEventBusDestinationOptions): destination is ApiMessageEventBusDestinationOptions;
declare function saveDestinationToDb(context: IRestApiContext, destination: ApiMessageEventBusDestinationOptions, subscribedEvents?: string[]): Promise<unknown>;
declare function deleteDestinationFromDb(context: IRestApiContext, destinationId: string): Promise<unknown>;
declare function sendTestMessageToDestination(context: IRestApiContext, destination: ApiMessageEventBusDestinationOptions): Promise<boolean>;
declare function getEventNamesFromBackend(context: IRestApiContext): Promise<string[]>;
declare function getDestinationsFromBackend(context: IRestApiContext): Promise<MessageEventBusDestinationOptions[]>;
//#endregion
export { hasDestinationId as a, getEventNamesFromBackend as i, deleteDestinationFromDb as n, saveDestinationToDb as o, getDestinationsFromBackend as r, sendTestMessageToDestination as s, ApiMessageEventBusDestinationOptions as t };
//# sourceMappingURL=eventbus.ee.d.mts.map