/** Shared shape for an exportable report. One report → one PDF (sections) or
 *  one workbook (sheets). `width` is a relative weight, scaled to the page. */
export interface ReportColumn {
  header: string;
  width: number;
  money?: boolean;
}

export interface ReportTable {
  name: string;
  columns: ReportColumn[];
  rows: Array<Array<string | number>>;
}

export interface Report {
  title: string;
  tables: ReportTable[];
}
