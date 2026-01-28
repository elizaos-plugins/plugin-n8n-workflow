import { t as IRestApiContext } from "./types2.cjs";
import { IHttpRequestMethods } from "n8n-workflow";

//#region src/api/webhooks.d.ts
type WebhookData = {
  workflowId: string;
  webhookPath: string;
  method: IHttpRequestMethods;
  node: string;
};
declare const findWebhook: (context: IRestApiContext, data: {
  path: string;
  method: string;
}) => Promise<WebhookData | null>;
//#endregion
export { findWebhook as t };
//# sourceMappingURL=webhooks.d.cts.map