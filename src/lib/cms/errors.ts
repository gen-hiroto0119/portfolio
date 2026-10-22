export type CmsErrorCode = "VALIDATION";

export class CmsError extends Error {
  readonly code: CmsErrorCode;
  constructor(code: CmsErrorCode, message: string) {
    super(message);
    this.name = "CmsError";
    this.code = code;
  }
}
