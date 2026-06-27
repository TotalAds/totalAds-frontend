export interface UserEmailTemplateRow {
  id: number;
  name: string;
  htmlContent: string;
}

export type BodyEditorMode = "simple" | "html";

export interface TemplateImportPayload {
  content: string;
  bodyEditor: BodyEditorMode;
}
