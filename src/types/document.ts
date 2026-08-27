export interface ProcessedDocument {
  PdcID: number;
  PrsID: number;
  PdcPeriodYear: string;
  PdcPeriodMonth: string;
  PdcPeriodWeek: string | null;
  PdcFilID: number;
  SecStatus: number;
  CreateUserId: number;
  UpdateUserId: number | null;
  DeleteUserId: number | null;
  CreateDate: string;
  UpdateDate: string | null;
  DeleteDate: string | null;
  PdcIsReceived: boolean | number;
  DprID: number;
  DprDisplayName?: string;
}
