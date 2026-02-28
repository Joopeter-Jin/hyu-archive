// lib/emailTemplates.ts
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export type NotifyEmailInput = {
  siteName: string
  postTitle: string
  category: string
  createdAt: Date
  postUrl: string
  rssUrl?: string
}

export function buildNewPostEmail(input: NotifyEmailInput) {
  const siteName = escapeHtml(input.siteName)
  const title = escapeHtml(input.postTitle)
  const category = escapeHtml(input.category)
  const createdAtText = input.createdAt.toLocaleString()
  const postUrl = input.postUrl
  const rssUrl = input.rssUrl

  const subject = `[${input.category}] ${input.postTitle}`

  const html = `
  <div style="background:#0b0b0b;padding:24px">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:#111;border:1px solid #262626;border-radius:14px;overflow:hidden">
      <tr>
        <td style="padding:18px 20px;border-bottom:1px solid #262626">
          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#fff;font-size:16px;font-weight:700">
            ${siteName}
          </div>
          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#9ca3af;font-size:12px;margin-top:6px">
            New post notification
          </div>
        </td>
      </tr>

      <tr>
        <td style="padding:18px 20px">
          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin-bottom:10px">
            <span style="display:inline-block;background:#1f2937;color:#e5e7eb;font-size:12px;padding:4px 10px;border-radius:999px;border:1px solid #374151">
              ${category}
            </span>
            <span style="color:#6b7280;font-size:12px;margin-left:10px">
              ${escapeHtml(createdAtText)}
            </span>
          </div>

          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#fff;font-size:20px;font-weight:800;line-height:1.3">
            ${title}
          </div>

          <div style="margin-top:16px">
            <a href="${postUrl}"
              style="display:inline-block;background:#fff;color:#000;text-decoration:none;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:14px;font-weight:700;padding:10px 14px;border-radius:10px">
              Read the post →
            </a>
          </div>

          <div style="margin-top:16px;color:#9ca3af;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px;line-height:1.6">
            If the button doesn’t work, open this link:<br/>
            <a href="${postUrl}" style="color:#93c5fd;text-decoration:underline">${postUrl}</a>
          </div>

          ${
            rssUrl
              ? `
            <div style="margin-top:18px;padding-top:14px;border-top:1px solid #262626;color:#9ca3af;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px">
              RSS for this category:
              <a href="${rssUrl}" style="color:#93c5fd;text-decoration:underline">${rssUrl}</a>
            </div>
          `
              : ""
          }
        </td>
      </tr>

      <tr>
        <td style="padding:14px 20px;border-top:1px solid #262626;color:#6b7280;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:11px">
          You received this email because you subscribed to category updates.
        </td>
      </tr>
    </table>
  </div>
  `.trim()

  const text = `${input.siteName}
[${input.category}] ${input.postTitle}
${createdAtText}

Read: ${postUrl}
${rssUrl ? `RSS: ${rssUrl}` : ""}`

  return { subject, html, text }
}