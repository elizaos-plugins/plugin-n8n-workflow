import { t as IRestApiContext } from "./types2.cjs";
import { ActionResultRequestDto, CommunityNodeType, OptionsRequestDto, ResourceLocatorRequestDto, ResourceMapperFieldsRequestDto } from "@n8n/api-types";
import { INodeListSearchResult, INodePropertyOptions, INodeTypeDescription, INodeTypeNameVersion, NodeParameterValueType, ResourceMapperFields } from "n8n-workflow";
import { INodeTranslationHeaders } from "@n8n/i18n";

//#region src/api/nodeTypes.d.ts
declare function getNodeTypes(baseUrl: string): Promise<any>;
declare function getNodeTypeVersions(baseUrl: string): Promise<string[]>;
declare function getNodeTypesByIdentifier(context: IRestApiContext, identifiers: string[]): Promise<INodeTypeDescription[]>;
declare function fetchCommunityNodeTypes(context: IRestApiContext): Promise<CommunityNodeType[]>;
declare function fetchCommunityNodeAttributes(context: IRestApiContext, type: string): Promise<CommunityNodeType | null>;
declare function getNodeTranslationHeaders(context: IRestApiContext): Promise<INodeTranslationHeaders | undefined>;
declare function getNodesInformation(context: IRestApiContext, nodeInfos: INodeTypeNameVersion[]): Promise<INodeTypeDescription[]>;
declare function getNodeParameterOptions(context: IRestApiContext, sendData: OptionsRequestDto): Promise<INodePropertyOptions[]>;
declare function getResourceLocatorResults(context: IRestApiContext, sendData: ResourceLocatorRequestDto): Promise<INodeListSearchResult>;
declare function getResourceMapperFields(context: IRestApiContext, sendData: ResourceMapperFieldsRequestDto): Promise<ResourceMapperFields>;
declare function getLocalResourceMapperFields(context: IRestApiContext, sendData: ResourceMapperFieldsRequestDto): Promise<ResourceMapperFields>;
declare function getNodeParameterActionResult(context: IRestApiContext, sendData: ActionResultRequestDto): Promise<NodeParameterValueType>;
//#endregion
export { getNodeParameterOptions as a, getNodeTypes as c, getResourceLocatorResults as d, getResourceMapperFields as f, getNodeParameterActionResult as i, getNodeTypesByIdentifier as l, fetchCommunityNodeTypes as n, getNodeTranslationHeaders as o, getLocalResourceMapperFields as r, getNodeTypeVersions as s, fetchCommunityNodeAttributes as t, getNodesInformation as u };
//# sourceMappingURL=nodeTypes.d.cts.map