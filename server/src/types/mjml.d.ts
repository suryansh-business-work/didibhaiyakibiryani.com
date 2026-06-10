// mjml v5 ships without type declarations; v5 made mjml2html async.
declare module "mjml" {
  interface MjmlError {
    line?: number;
    message: string;
    tagName?: string;
  }
  interface MjmlResult {
    html: string;
    errors: MjmlError[];
  }
  export default function mjml2html(
    mjml: string,
    options?: { validationLevel?: "strict" | "soft" | "skip" }
  ): Promise<MjmlResult>;
}
