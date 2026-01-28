import { t as IRestApiContext } from "./types2.mjs";
import { ApiKey, ApiKeyWithRawValue, CreateApiKeyRequestDto, UpdateApiKeyRequestDto } from "@n8n/api-types";
import { ApiKeyScope } from "@n8n/permissions";

//#region src/api/api-keys.d.ts
declare function getApiKeys(context: IRestApiContext): Promise<ApiKey[]>;
declare function getApiKeyScopes(context: IRestApiContext): Promise<ApiKeyScope[]>;
declare function createApiKey(context: IRestApiContext, payload: CreateApiKeyRequestDto): Promise<ApiKeyWithRawValue>;
declare function deleteApiKey(context: IRestApiContext, id: string): Promise<{
  success: boolean;
}>;
declare function updateApiKey(context: IRestApiContext, id: string, payload: UpdateApiKeyRequestDto): Promise<{
  success: boolean;
}>;
//#endregion
export { updateApiKey as a, getApiKeys as i, deleteApiKey as n, getApiKeyScopes as r, createApiKey as t };
//# sourceMappingURL=api-keys.d.mts.map