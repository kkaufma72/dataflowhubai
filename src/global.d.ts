export {};

declare module 'lucide-react' {
  export * from 'lucide-react/dist/lucide-react';
}

declare module 'file-saver' {
  export function saveAs(
    data: Blob | File | string,
    filename?: string,
    options?: { autoBom?: boolean }
  ): void;
}
