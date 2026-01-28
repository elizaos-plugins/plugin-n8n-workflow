import { t as ITag } from "./tags.cjs";
import { IConnections, INode, IPinData, IWorkflowSettings } from "n8n-workflow";

//#region src/api/workflows.d.ts
interface WorkflowMetadata {
  onboardingId?: string;
  templateId?: string;
  instanceId?: string;
  templateCredsSetupCompleted?: boolean;
}
interface WorkflowData {
  id?: string;
  name?: string;
  active?: boolean;
  nodes: INode[];
  connections: IConnections;
  settings?: IWorkflowSettings;
  tags?: string[];
  pinData?: IPinData;
  versionId?: string;
  activeVersionId?: string | null;
  meta?: WorkflowMetadata;
}
interface WorkflowDataUpdate {
  id?: string;
  name?: string;
  description?: string | null;
  nodes?: INode[];
  connections?: IConnections;
  settings?: IWorkflowSettings;
  active?: boolean;
  tags?: ITag[] | string[];
  pinData?: IPinData;
  versionId?: string;
  meta?: WorkflowMetadata;
  parentFolderId?: string;
  uiContext?: string;
  expectedChecksum?: string;
  aiBuilderAssisted?: boolean;
  autosaved?: boolean;
}
interface WorkflowDataCreate extends WorkflowDataUpdate {
  projectId?: string;
}
//#endregion
export { WorkflowMetadata as i, WorkflowDataCreate as n, WorkflowDataUpdate as r, WorkflowData as t };
//# sourceMappingURL=workflows.d.cts.map