import { Button } from "@/types/blocks/base";

type ValidationRule = {
  required?: boolean;
  min?: number;
  max?: number;
  message?: string;
  email?: boolean;
};

export interface FormField {
  name?: string;
  title?: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "password"
    | "select"
    | "url"
    | "editor"
    | "code_editor"
    | "richtext_editor"
    | "markdown_editor";
  placeholder?: string;
  options?: {
    title: string;
    value: string;
  }[];
  value?: string;
  tip?: string;
  attributes?: Record<string, unknown>;
  validation?: ValidationRule;
}

export interface FormSubmit {
  button?: Button;
  handler?: (
    data: FormData,
    passby?: unknown
  ) => Promise<
    | {
        status: "success" | "error";
        message: string;
        redirect_url?: string;
      }
    | undefined
    | void
  >;
}

export interface Form {
  fields?: FormField[];
  data?: Record<string, unknown>;
  passby?: unknown;
  submit?: FormSubmit;
  loading?: boolean;
}
