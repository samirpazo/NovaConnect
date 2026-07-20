export interface DinMenuProgram {
  MnpID: number;
  MnpDate: string;
  MnpStatus: number;
  SecStatus: boolean;
}

export interface DinMenuType {
  MtpID: number;
  MsvID: number;
  MtpName: string;
  MtpIsDefault: boolean;
  SecStatus: boolean;
}

export interface DinMenuProgramDetail {
  MpdID: number;
  MnpID: number;
  MtpID: number;
  MpdDishName: string;
  SecStatus: boolean;
}

export interface DinMenuProgramDetailCe extends DinMenuProgramDetail {
  MsvID: number;
  MtpIsDefault: boolean;
  MtpColor?: string;
  MtpPrice: number;
  MsvName: string;
  MsvStartTime?: string;
  MsvEndTime?: string;
  MtpName?: string;
  MrtID?: number;
  MrtRating?: number;
  MrtComment?: string;
}
