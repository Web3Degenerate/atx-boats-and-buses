import { query } from "@/lib/db";

type EmailTemplateRow = {
  subject: string;
  html_body: string;
};

export async function getEmailTemplate(id: string): Promise<{ subject: string; html_body: string } | null> {
  const result = await query<EmailTemplateRow>(
    "SELECT subject, html_body FROM email_templates WHERE id = $1",
    [id]
  );

  return result.rows[0] ?? null;
}

export function renderTemplate(html: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce(
    (output, [key, value]) => output.replaceAll(`{{${key}}}`, value),
    html
  );
}
