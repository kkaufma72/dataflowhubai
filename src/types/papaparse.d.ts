declare module 'papaparse' {
  export interface ParseConfig {
    header?: boolean;
    skipEmptyLines?: boolean;
    dynamicTyping?: boolean;
    complete?: (results: any) => void;
    error?: (error: any) => void;
  }
  
  export interface ParseResult {
    data: any[];
    errors: any[];
    meta: {
      fields?: string[];
    };
  }
  
  export function parse(content: string, config: ParseConfig): void;
}
