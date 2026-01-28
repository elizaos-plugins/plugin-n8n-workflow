import { INodeParameters } from "n8n-workflow";

//#region src/api/versions.d.ts
interface VersionNode {
  name: string;
  displayName: string;
  icon: string;
  iconUrl?: string;
  defaults: INodeParameters;
  iconData: {
    type: string;
    icon?: string;
    fileBuffer?: string;
  };
  typeVersion?: number;
}
interface Version {
  name: string;
  nodes: VersionNode[];
  createdAt: string;
  description: string;
  documentationUrl: string;
  hasBreakingChange: boolean;
  hasSecurityFix: boolean;
  hasSecurityIssue: boolean;
  securityIssueFixVersion: string;
}
interface WhatsNewSection {
  title: string;
  calloutText: string;
  footer: string;
  items: WhatsNewArticle[];
  createdAt: string;
  updatedAt: string | null;
}
interface WhatsNewArticle {
  id: number;
  createdAt: string;
  updatedAt: string | null;
  publishedAt: string;
  title: string;
  content: string;
}
declare function getNextVersions(endpoint: string, currentVersion: string, instanceId: string): Promise<Version[]>;
declare function getWhatsNewSection(endpoint: string, currentVersion: string, instanceId: string): Promise<WhatsNewSection>;
//#endregion
export { getNextVersions as a, WhatsNewSection as i, VersionNode as n, getWhatsNewSection as o, WhatsNewArticle as r, Version as t };
//# sourceMappingURL=versions.d.cts.map