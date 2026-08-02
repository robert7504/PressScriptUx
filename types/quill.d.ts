declare module "quill" {
  export type QuillOptions = {
    theme?: string;
    modules?: Record<string, unknown>;
    placeholder?: string;
    readOnly?: boolean;
  };

  export default class Quill {
    static import(name: string): unknown;
    static register(
      path: string | Record<string, unknown> | unknown,
      target?: unknown,
      overwrite?: boolean,
    ): void;

    constructor(container: HTMLElement | string, options?: QuillOptions);

    root: HTMLElement;
    clipboard: {
      dangerouslyPasteHTML(html: string): void;
    };

    on(
      eventName: "text-change" | "selection-change" | "editor-change",
      handler: () => void,
    ): void;
    enable(enabled?: boolean): void;
    disable(): void;
    format(name: string, value: unknown): void;
    getFormat(range?: unknown): Record<string, unknown>;
    getSelection(focus?: boolean): { index: number; length: number } | null;
    getText(): string;
    getSemanticHTML(): string;
  }
}

declare module "quill/dist/quill.snow.css";
