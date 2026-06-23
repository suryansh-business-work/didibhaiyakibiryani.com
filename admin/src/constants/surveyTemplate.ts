/** Placeholders the survey-message template understands. */
export const SURVEY_PLACEHOLDERS: ReadonlyArray<{ token: string; desc: string }> = [
  { token: "{{name}}", desc: "Customer name" },
  { token: "{{surveyLink}}", desc: "Per-order survey link" },
  { token: "{{orderNumber}}", desc: "Receipt / order no." },
  { token: "{{brandName}}", desc: "Brand name (from Branding)" },
  { token: "{{website}}", desc: "Website (from Branding)" },
];

/** Default message used when no template has been saved yet. */
export const DEFAULT_SURVEY_TEMPLATE = `Hi {{name}},

Greetings from {{brandName}}!

We hope you enjoyed your meal. We would greatly appreciate it if you could take a moment to share your feedback and rate your experience using the link below:

{{surveyLink}}

Your feedback helps us improve and serve you better. If you have any upcoming orders or special requirements, please feel free to let us know.

Thank you for choosing {{brandName}}. We look forward to serving you again!

Best Regards,
Team {{brandName}} 🍛🙏
Website: {{website}}
Receipt no: {{orderNumber}}`;

export interface SurveyVars {
  name: string;
  surveyLink: string;
  orderNumber: string;
  brandName: string;
  website: string;
}

/** Replace every {{token}} in the template with its dynamic value. */
export function fillSurveyTemplate(template: string, vars: SurveyVars): string {
  return template
    .replaceAll("{{name}}", vars.name)
    .replaceAll("{{surveyLink}}", vars.surveyLink)
    .replaceAll("{{orderNumber}}", vars.orderNumber)
    .replaceAll("{{brandName}}", vars.brandName)
    .replaceAll("{{website}}", vars.website);
}
