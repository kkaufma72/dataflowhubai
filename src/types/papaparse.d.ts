declare module 'papaparse' {
  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  export interface ParseMeta {
    fields?: string[];
    aborted?: boolean;
    truncated?: boolean;
    cursor?: number;
  }

  export interface ParseResult<T = unknown> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }
  
  export interface ParseConfig<T = unknown> {
    header?: boolean;
    skipEmptyLines?: boolean;
    dynamicTyping?: boolean;
    complete?: (results: ParseResult<T>) => void;
    error?: (error: ParseError) => void;
  }
  
  export function parse<T = unknown>(content: string | File, config: ParseConfig<T>): void;
}
