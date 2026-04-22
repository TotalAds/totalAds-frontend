/**
 * Built-in email starter templates for the campaign builder.
 *
 * Design principles:
 *  - Table-based, inline-style HTML for universal email client support
 *  - Tested against Gmail, Apple Mail, Outlook 2016-2365, Yahoo Mail, HEY, Superhuman
 *  - Max-width 600 px; single-column first for reliability
 *  - MSO/VML comments where Outlook needs nudging
 *  - No web fonts; system stack only for inbox rendering parity
 *  - Brand accent `#3b82f6` (blue-500) throughout
 *
 * @module emailTemplates
 */

export const BRAND_PRIMARY = "#3b82f6";
export const BRAND_DARK = "#1e40af";
export const BRAND_LIGHT = "#eff6ff";

export type BuiltInTemplateKind = "basic" | "ready";

export interface BuiltInEmailTemplate {
  id: string;
  kind: BuiltInTemplateKind;
  name: string;
  description: string;
  htmlContent: string;
  /** Ready-to-use only: filter label */
  category?: string;
}

// ─── Design tokens (local) ────────────────────────────────────────────────────

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
const DARK  = "#0f172a";
const MID   = "#374151";
const MUTED = "#64748b";
const BORDER= "#e2e8f0";
const SURFACE = "#f8fafc";

// ─── Helpers (mirrors core set — kept local for module independence) ───────────

const wrap = (inner: string, bg = "#f1f5f9") =>
  `<!--[if mso]><table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
  style="background-color:${bg};margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
        style="max-width:600px;">
        <tr><td>${inner}</td></tr>
      </table>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->`;

const card = (inner: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
    style="background:#ffffff;border-radius:12px;border:1px solid ${BORDER};overflow:hidden;">
  ${inner}
</table>`;

const pillBtn = (label: string, href = "#", bg = BRAND_PRIMARY, color = "#ffffff") =>
  `<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}"
  style="height:46px;v-text-anchor:middle;width:220px;" arcsize="50%"
  strokecolor="${bg}" fillcolor="${bg}">
  <w:anchorlock/>
  <center style="color:${color};font-family:${FONT};font-size:14px;font-weight:700;">${label}</center>
</v:roundrect><![endif]--><!--[if !mso]><!-->
<a href="${href}" target="_blank"
  style="display:inline-block;background-color:${bg};color:${color};font-family:${FONT};
         font-size:14px;font-weight:700;line-height:1;text-decoration:none;
         padding:14px 28px;border-radius:999px;mso-hide:all;">${label}</a><!--<![endif]-->`;

const ghostBtn = (label: string, href = "#") =>
  `<a href="${href}" target="_blank"
  style="display:inline-block;background-color:transparent;color:${BRAND_PRIMARY};
         font-family:${FONT};font-size:14px;font-weight:700;line-height:1;
         text-decoration:none;padding:13px 26px;border-radius:999px;
         border:2px solid ${BRAND_PRIMARY};">${label}</a>`;

const eye = (text: string, color = BRAND_PRIMARY) =>
  `<p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:700;
     letter-spacing:0.12em;text-transform:uppercase;color:${color};">${text}</p>`;

const divider = () =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr><td style="border-top:1px solid ${BORDER};font-size:0;line-height:0;padding:0;">&nbsp;</td></tr>
</table>`;

const footer = (co = "{{company}}", unsub = "{{unsubscribeUrl}}") =>
  `<tr>
  <td style="padding:20px 32px;border-top:1px solid #f1f5f9;background:${SURFACE};
       font-family:${FONT};font-size:12px;color:#94a3b8;text-align:center;">
    © ${co} · You're receiving this because you signed up or opted in.<br/>
    <a href="${unsub}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
    &nbsp;·&nbsp;
    <a href="#" style="color:#94a3b8;text-decoration:underline;">View in browser</a>
    &nbsp;·&nbsp;
    <a href="#" style="color:#94a3b8;text-decoration:underline;">Privacy policy</a>
  </td>
</tr>`;

/** Numbered badge (circle) */
const badge = (n: string | number, active = true) =>
  `<span style="display:inline-block;width:28px;height:28px;border-radius:50%;
    background:${active ? BRAND_PRIMARY : BORDER};text-align:center;line-height:28px;
    font-family:${FONT};font-size:13px;font-weight:800;
    color:${active ? "#ffffff" : MUTED};">${n}</span>`;

/** Progress bar (0–100) */
const progressBar = (pct: number, label: string) =>
  `<p style="margin:0 0 6px;font-family:${FONT};font-size:12px;font-weight:600;color:${DARK};">
    ${label}
  </p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
    style="background:${BORDER};border-radius:999px;height:8px;">
    <tr>
      <td width="${pct}%" style="background:${BRAND_PRIMARY};border-radius:999px;
           height:8px;font-size:0;line-height:0;">&nbsp;</td>
      <td></td>
    </tr>
  </table>`;

/** Tag / chip */
const chip = (text: string, bg = BRAND_LIGHT, color = BRAND_PRIMARY) =>
  `<span style="display:inline-block;background:${bg};color:${color};border-radius:999px;
    padding:3px 10px;font-family:${FONT};font-size:11px;font-weight:700;
    letter-spacing:0.06em;text-transform:uppercase;">${text}</span>`;

/** Horizontal key-value stat cell */
const stat = (value: string, label: string) =>
  `<td align="center" style="padding:20px 12px;">
    <p style="margin:0;font-family:${FONT};font-size:26px;font-weight:900;color:${BRAND_PRIMARY};
              letter-spacing:-0.5px;">${value}</p>
    <p style="margin:5px 0 0;font-family:${FONT};font-size:11px;color:${MUTED};
              text-transform:uppercase;letter-spacing:0.08em;">${label}</p>
  </td>`;

/** Single feature row (icon + title + description) */
const featureRow = (icon: string, title: string, desc: string) =>
  `<tr>
    <td style="padding:16px 0;border-bottom:1px solid ${BORDER};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td width="44" valign="top" style="padding-top:2px;">
            <span style="display:inline-block;width:36px;height:36px;border-radius:9px;
              background:${BRAND_LIGHT};text-align:center;line-height:36px;font-size:18px;">
              ${icon}
            </span>
          </td>
          <td valign="top" style="padding-left:4px;">
            <p style="margin:0 0 3px;font-family:${FONT};font-size:15px;font-weight:700;
                      color:${DARK};">${title}</p>
            <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.65;
                      color:${MID};">${desc}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

/** Pricing tier card (inline-block for two-up layouts) */
const tierCard = (
  name: string,
  price: string,
  per: string,
  features: string[],
  highlight = false
) => {
  const bg   = highlight ? DARK        : SURFACE;
  const bdr  = highlight ? DARK        : BORDER;
  const h1c  = highlight ? "#ffffff"   : DARK;
  const pc   = highlight ? BRAND_PRIMARY : BRAND_PRIMARY;
  const fc   = highlight ? "#cbd5e1"   : MID;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
    style="background:${bg};border-radius:12px;border:2px solid ${bdr};">
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 4px;font-family:${FONT};font-size:12px;font-weight:700;
                  text-transform:uppercase;letter-spacing:0.1em;color:${pc};">${name}</p>
        <p style="margin:0 0 16px;font-family:${FONT};font-size:32px;font-weight:900;
                  color:${h1c};letter-spacing:-1px;">${price}
          <span style="font-size:14px;font-weight:500;color:${fc};">/${per}</span>
        </p>
        ${features.map(f =>
          `<p style="margin:0 0 9px;font-family:${FONT};font-size:13px;color:${fc};">
            <span style="color:${pc};font-weight:700;">✓</span> &nbsp;${f}
          </p>`
        ).join("")}
      </td>
    </tr>
  </table>`;
};


// ─── Shared helpers ───────────────────────────────────────────────────────────

/** System font stack safe across all major clients */
// const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

/**
 * Outer shell: full-width background table, centred inner card.
 * Outlook conditional width keeps the card from collapsing on mso.
 */
// const wrap = (inner: string, bgColor = "#f1f5f9") => `<!--[if mso]><table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
// <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
//   style="background-color:${bgColor};margin:0;padding:0;">
//   <tr>
//     <td align="center" style="padding:32px 12px;">
//       <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
//         style="max-width:600px;">
//         <tr><td>${inner}</td></tr>
//       </table>
//     </td>
//   </tr>
// </table>
// <!--[if mso]></td></tr></table><![endif]-->`;

// /** Standard white card container */
// const card = (inner: string, radius = "12px") =>
//   `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
//     style="background:#ffffff;border-radius:${radius};border:1px solid #e2e8f0;overflow:hidden;">
//   ${inner}
// </table>`;

// /** Pill-style CTA button — cross-client via VML fallback for Outlook */
// const pillBtn = (
//   label: string,
//   href = "#",
//   bg = BRAND_PRIMARY,
//   color = "#ffffff"
// ) => `<!--[if mso]>
// <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}"
//   style="height:46px;v-text-anchor:middle;width:200px;" arcsize="50%"
//   strokecolor="${bg}" fillcolor="${bg}">
//   <w:anchorlock/>
//   <center style="color:${color};font-family:${FONT};font-size:14px;font-weight:700;">${label}</center>
// </v:roundrect>
// <![endif]--><!--[if !mso]><!-->
// <a href="${href}" target="_blank"
//   style="display:inline-block;background-color:${bg};color:${color};font-family:${FONT};
//          font-size:14px;font-weight:700;line-height:1;text-decoration:none;
//          padding:14px 28px;border-radius:999px;mso-hide:all;">${label}</a>
// <!--<![endif]-->`;

/** Ghost / outline button variant */
const outlineBtn = (label: string, href = "#") =>
  `<a href="${href}" target="_blank"
  style="display:inline-block;background-color:transparent;color:${BRAND_PRIMARY};
         font-family:${FONT};font-size:14px;font-weight:700;line-height:1;text-decoration:none;
         padding:13px 26px;border-radius:999px;border:2px solid ${BRAND_PRIMARY};">${label}</a>`;

/** Thin accent rule */
const rule = (my = "20px") =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
    style="margin:${my} 0;">
  <tr><td style="border-top:1px solid #e2e8f0;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>`;

/** Section label in caps — used as eyebrow text */
const eyebrow = (text: string, color = BRAND_PRIMARY) =>
  `<p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:700;
     letter-spacing:0.12em;text-transform:uppercase;color:${color};">${text}</p>`;

// /** Standard footer row */
// const footer = (companyToken = "{{company}}", unsubToken = "{{unsubscribeUrl}}") =>
//   `<tr>
//   <td style="padding:20px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;
//        font-family:${FONT};font-size:12px;color:#94a3b8;text-align:center;">
//     © ${companyToken} · You're receiving this because you signed up for updates.
//     <br/>
//     <a href="${unsubToken}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
//     &nbsp;·&nbsp;
//     <a href="#" style="color:#94a3b8;text-decoration:underline;">View in browser</a>
//   </td>
// </tr>`;

/** Utility: key-value detail row (used in event / pricing blocks) */
const detailRow = (icon: string, label: string, value: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
    style="margin-bottom:10px;">
  <tr>
    <td width="28" valign="middle" style="font-size:16px;">${icon}</td>
    <td valign="middle" style="font-family:${FONT};font-size:14px;color:#374151;">
      <strong style="color:#0f172a;">${label}</strong>&nbsp; ${value}
    </td>
  </tr>
</table>`;

// ─── BASIC TEMPLATES ──────────────────────────────────────────────────────────

export const BASIC_EMAIL_TEMPLATES: BuiltInEmailTemplate[] = [
  // ── 1. Default ──────────────────────────────────────────────────────────────
  {
    id: "basic-default",
    kind: "basic",
    name: "Default template",
    description: "Logo, headline, body copy, and a single call-to-action.",
    htmlContent: wrap(
      card(`
      <!-- Logo row -->
      <tr>
        <td align="center" style="padding:32px 32px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:${BRAND_LIGHT};border-radius:10px;padding:10px 20px;">
                <span style="font-family:${FONT};font-size:18px;font-weight:800;
                             color:${BRAND_PRIMARY};letter-spacing:-0.5px;">YOURLOGO</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Headline -->
      <tr>
        <td style="padding:28px 40px 0;">
          <h1 style="margin:0;font-family:${FONT};font-size:28px;font-weight:800;
                     line-height:1.2;color:#0f172a;letter-spacing:-0.5px;">
            This is your headline
          </h1>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:14px 40px 0;">
          <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.75;color:#475569;">
            Hi {{firstName}}, use this space for a short intro. Keep it focused on one
            compelling idea — clarity converts better than cleverness.
          </p>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:28px 40px 36px;">
          ${pillBtn("Primary action")}
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 2. Sell a product ───────────────────────────────────────────────────────
  {
    id: "basic-product",
    kind: "basic",
    name: "Sell a product",
    description: "Image placeholder, benefits, price, and checkout button.",
    htmlContent: wrap(
      card(`
      <!-- Header accent bar -->
      <tr>
        <td style="background:${BRAND_PRIMARY};padding:3px 0;font-size:0;line-height:0;">
          &nbsp;
        </td>
      </tr>
      <!-- Product image placeholder -->
      <tr>
        <td style="padding:32px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <!-- Image block -->
              <td width="45%" valign="top" style="padding-right:20px;">
                <div style="background:#f1f5f9;border-radius:10px;height:160px;border:1px dashed #cbd5e1;
                            text-align:center;line-height:160px;">
                  <span style="font-family:${FONT};font-size:11px;color:#94a3b8;
                               text-transform:uppercase;letter-spacing:0.08em;">Image</span>
                </div>
              </td>
              <!-- Details -->
              <td valign="top">
                ${eyebrow("Featured product")}
                <h2 style="margin:0 0 10px;font-family:${FONT};font-size:20px;font-weight:800;
                           line-height:1.25;color:#0f172a;">
                  Essential gear for every adventure
                </h2>
                <p style="margin:0 0 14px;font-family:${FONT};font-size:14px;
                          line-height:1.65;color:#64748b;">
                  Two sharp lines on what makes this different.
                </p>
                <p style="margin:0 0 18px;font-family:${FONT};font-size:26px;
                          font-weight:800;color:#0f172a;">$49<span style="font-size:16px;
                          font-weight:600;color:#64748b;">.00</span></p>
                ${pillBtn("Buy now", "#", BRAND_PRIMARY)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Trust line -->
      <tr>
        <td style="padding:20px 40px 32px;">
          <p style="margin:0;font-family:${FONT};font-size:12px;color:#94a3b8;">
            ✓ Free shipping &nbsp; ✓ 30-day returns &nbsp; ✓ Secure checkout
          </p>
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 3. Tell a story ─────────────────────────────────────────────────────────
  {
    id: "basic-story",
    kind: "basic",
    name: "Tell a story",
    description: "Narrative layout with pull-quote block.",
    htmlContent: wrap(
      card(`
      <!-- Top brand strip -->
      <tr>
        <td style="padding:24px 40px 0;">
          <span style="font-family:${FONT};font-size:14px;font-weight:800;
                       color:${BRAND_PRIMARY};">{{company}}</span>
        </td>
      </tr>
      ${rule("0")}
      <!-- Eyebrow + headline -->
      <tr>
        <td style="padding:28px 40px 0;">
          ${eyebrow("Our story")}
          <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:800;
                     line-height:1.25;color:#0f172a;letter-spacing:-0.3px;">
            We started with a simple question
          </h1>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:14px 40px 0;">
          <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.75;color:#475569;">
            Hi {{firstName}}, every great company begins with a problem worth solving.
            Share why you care, what changed, and what you learned along the way.
          </p>
        </td>
      </tr>
      <!-- Pull quote -->
      <tr>
        <td style="padding:24px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="4" style="background:${BRAND_PRIMARY};border-radius:2px;font-size:0;">
                &nbsp;
              </td>
              <td style="padding:16px 20px;background:${BRAND_LIGHT};border-radius:0 8px 8px 0;">
                <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.65;
                          color:#1e3a8a;font-style:italic;">
                  "Short customer or team quote that reinforces trust and credibility."
                </p>
                <p style="margin:8px 0 0;font-family:${FONT};font-size:12px;
                          color:#3b82f6;font-weight:700;">— Name, Title</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 4. Announcement ─────────────────────────────────────────────────────────
  {
    id: "basic-announcement",
    kind: "basic",
    name: "Announcement",
    description: "Bold header strip, headline, and supporting copy.",
    htmlContent: wrap(
      card(`
      <!-- Header -->
      <tr>
        <td align="center" style="padding:20px 32px;background:${BRAND_PRIMARY};">
          <span style="font-family:${FONT};font-size:11px;font-weight:700;
                       letter-spacing:0.15em;text-transform:uppercase;color:#bfdbfe;">
            Important update
          </span>
          <h1 style="margin:10px 0 0;font-family:${FONT};font-size:26px;font-weight:800;
                     color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
            We have news to share
          </h1>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:32px 40px 0;">
          <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.75;color:#475569;">
            Hi {{firstName}}, lead with the one thing readers need to know right now,
            then add a short paragraph with the context they need to act.
          </p>
        </td>
      </tr>
      <!-- Key detail callout -->
      <tr>
        <td style="padding:20px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:16px 20px;font-family:${FONT};font-size:14px;
                         line-height:1.6;color:#374151;">
                <strong style="color:#0f172a;">What this means for you:</strong><br/>
                One sentence on what changes, and one on what stays the same.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:28px 40px 36px;">
          ${outlineBtn("Learn more")}
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 5. Two columns ──────────────────────────────────────────────────────────
  {
    id: "basic-two-column",
    kind: "basic",
    name: "Two columns",
    description: "Side-by-side blocks for features or comparisons.",
    htmlContent: wrap(
      card(`
      <!-- Header -->
      <tr>
        <td style="padding:32px 40px 0;">
          ${eyebrow("Compare")}
          <h1 style="margin:0;font-family:${FONT};font-size:24px;font-weight:800;
                     color:#0f172a;letter-spacing:-0.3px;">Compare your options</h1>
          <p style="margin:10px 0 0;font-family:${FONT};font-size:15px;
                    line-height:1.65;color:#64748b;">
            Hi {{firstName}}, use two columns for parallel ideas or feature comparisons.
          </p>
        </td>
      </tr>
      <!-- Two cards -->
      <tr>
        <td style="padding:24px 32px 32px;">
          <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td width="260" valign="top"><![endif]-->
          <div style="display:inline-block;vertical-align:top;width:47%;
                      min-width:200px;margin:0 1.5%;
                      background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding:5px 0 0;background:${BRAND_PRIMARY};
                           border-radius:8px 8px 0 0;font-size:0;">&nbsp;</td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  ${eyebrow("Option A")}
                  <p style="margin:0;font-family:${FONT};font-size:14px;
                            line-height:1.65;color:#475569;">
                    Short benefit statement and one concrete proof point.
                  </p>
                </td>
              </tr>
            </table>
          </div><!--[if mso]></td><td width="20">&nbsp;</td><td width="260" valign="top"><![endif]-->
          <div style="display:inline-block;vertical-align:top;width:47%;
                      min-width:200px;margin:0 1.5%;
                      background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding:5px 0 0;background:#0f172a;
                           border-radius:8px 8px 0 0;font-size:0;">&nbsp;</td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  ${eyebrow("Option B", "#64748b")}
                  <p style="margin:0;font-family:${FONT};font-size:14px;
                            line-height:1.65;color:#475569;">
                    Short benefit statement and one concrete proof point.
                  </p>
                </td>
              </tr>
            </table>
          </div>
          <!--[if mso]></td></tr></table><![endif]-->
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 6. Event invite ─────────────────────────────────────────────────────────
  {
    id: "basic-event",
    kind: "basic",
    name: "Event invite",
    description: "Date, time, location, and RSVP.",
    htmlContent: wrap(
      card(`
      <!-- Brand bar -->
      <tr>
        <td style="padding:20px 32px;border-bottom:1px solid #f1f5f9;">
          <span style="font-family:${FONT};font-size:14px;font-weight:800;
                       color:${BRAND_PRIMARY};">{{company}}</span>
        </td>
      </tr>
      <!-- Headline -->
      <tr>
        <td align="center" style="padding:36px 40px 0;">
          ${eyebrow("Save the date")}
          <h1 style="margin:8px 0 0;font-family:${FONT};font-size:26px;font-weight:800;
                     color:#0f172a;letter-spacing:-0.5px;">Webinar / Meetup Title</h1>
        </td>
      </tr>
      <!-- Detail pills -->
      <tr>
        <td style="padding:24px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:${BRAND_LIGHT};border-radius:12px;">
            <tr>
              <td style="padding:20px 24px;">
                ${detailRow("📅", "Date", "Thursday, January 15")}
                ${detailRow("🕐", "Time", "11:00 AM EST / 4:00 PM GMT")}
                ${detailRow("🖥️", "Where", "Online — link sent after RSVP")}
                ${detailRow("⏱️", "Duration", "45 minutes + Q&A")}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td align="center" style="padding:28px 40px 36px;">
          ${pillBtn("RSVP — It's free")}
          <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;">
            Spots are limited. Calendar invite sent immediately.
          </p>
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 7. Minimal letter ───────────────────────────────────────────────────────
  {
    id: "basic-minimal",
    kind: "basic",
    name: "Minimal letter",
    description: "Plain, personal letter with signature line.",
    htmlContent: wrap(
      card(`
      <!-- Logo / sender name -->
      <tr>
        <td style="padding:28px 40px 0;">
          <span style="font-family:${FONT};font-size:14px;font-weight:800;
                       color:${BRAND_PRIMARY};">{{company}}</span>
        </td>
      </tr>
      ${rule("0")}
      <!-- Letter body -->
      <tr>
        <td style="padding:28px 40px 0;">
          <p style="margin:0 0 16px;font-family:${FONT};font-size:16px;
                    line-height:1.75;color:#0f172a;font-weight:600;">
            Hi {{firstName}},
          </p>
          <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;
                    line-height:1.8;color:#374151;">
            Write your first paragraph here. One clear idea per paragraph is all
            you need. Keep the tone warm and direct — like you're writing to one person.
          </p>
          <p style="margin:0;font-family:${FONT};font-size:15px;
                    line-height:1.8;color:#374151;">
            A second paragraph if you need it, then wrap up naturally.
          </p>
        </td>
      </tr>
      <!-- Signature -->
      <tr>
        <td style="padding:24px 40px 36px;">
          <p style="margin:0;font-family:${FONT};font-size:15px;
                    line-height:1.75;color:#374151;">
            Thanks,<br/>
            <strong style="color:#0f172a;">{{senderName}}</strong><br/>
            <span style="color:#64748b;font-size:13px;">{{company}}</span>
          </p>
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 8. Three highlights ─────────────────────────────────────────────────────
  {
    id: "basic-three-cards",
    kind: "basic",
    name: "Three highlights",
    description: "Three equal cards for features or steps.",
    htmlContent: wrap(
      card(`
      <!-- Header -->
      <tr>
        <td align="center" style="padding:32px 40px 0;">
          ${eyebrow("Why teams choose us")}
          <h1 style="margin:0;font-family:${FONT};font-size:24px;font-weight:800;
                     color:#0f172a;letter-spacing:-0.3px;">
            Everything you need, nothing you don't
          </h1>
          <p style="margin:10px 0 0;font-family:${FONT};font-size:14px;
                    color:#64748b;line-height:1.65;">
            Hi {{firstName}}, here's why thousands of teams trust us every day.
          </p>
        </td>
      </tr>
      <!-- Three cards -->
      <tr>
        <td style="padding:24px 32px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="32%" valign="top" style="padding-right:8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                  style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                  <tr>
                    <td style="padding:20px;text-align:center;">
                      <p style="margin:0 0 8px;font-size:24px;">⚡</p>
                      <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;
                                font-weight:800;color:#0f172a;">Fast setup</p>
                      <p style="margin:0;font-family:${FONT};font-size:12px;
                                color:#64748b;line-height:1.5;">Live in under 5 minutes, guaranteed.</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td width="32%" valign="top" style="padding:0 4px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                  style="background:${BRAND_PRIMARY};border-radius:10px;">
                  <tr>
                    <td style="padding:20px;text-align:center;">
                      <p style="margin:0 0 8px;font-size:24px;">💳</p>
                      <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;
                                font-weight:800;color:#ffffff;">Clear pricing</p>
                      <p style="margin:0;font-family:${FONT};font-size:12px;
                                color:#bfdbfe;line-height:1.5;">No hidden fees. Cancel any time.</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td width="32%" valign="top" style="padding-left:8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                  style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                  <tr>
                    <td style="padding:20px;text-align:center;">
                      <p style="margin:0 0 8px;font-size:24px;">🤝</p>
                      <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;
                                font-weight:800;color:#0f172a;">Human support</p>
                      <p style="margin:0;font-family:${FONT};font-size:12px;
                                color:#64748b;line-height:1.5;">Real people, response under 2 hrs.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:28px 40px 36px;">
          ${pillBtn("Start free trial")}
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 9. Header + nav ─────────────────────────────────────────────────────────
  {
    id: "basic-header-nav",
    kind: "basic",
    name: "Header + nav",
    description: "Logo row with navigation links and hero block.",
    htmlContent: wrap(
      card(`
      <!-- Nav header -->
      <tr>
        <td style="padding:16px 28px;border-bottom:1px solid #f1f5f9;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="font-family:${FONT};font-size:16px;font-weight:800;
                         color:${BRAND_PRIMARY};">YOURLOGO</td>
              <td align="right" style="font-family:${FONT};font-size:12px;
                                       color:#64748b;font-weight:500;">
                <a href="#" style="color:#64748b;text-decoration:none;margin-left:16px;">Shop</a>
                <a href="#" style="color:#64748b;text-decoration:none;margin-left:16px;">Blog</a>
                <a href="#" style="color:#64748b;text-decoration:none;margin-left:16px;">Help</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Hero -->
      <tr>
        <td style="padding:36px 40px 0;">
          ${eyebrow("What's new")}
          <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:800;
                     line-height:1.25;color:#0f172a;letter-spacing:-0.5px;">
            Headline for this send
          </h1>
          <p style="margin:14px 0 0;font-family:${FONT};font-size:15px;
                    line-height:1.75;color:#475569;">
            Hi {{firstName}}, support the headline with one clear paragraph
            that earns the click below.
          </p>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:24px 40px 36px;">
          ${pillBtn("Read more →")}
        </td>
      </tr>
      ${footer()}`)
    ),
  },
];

// ─── READY-TO-USE TEMPLATES ───────────────────────────────────────────────────

export const READY_TO_USE_EMAIL_TEMPLATES: BuiltInEmailTemplate[] = [
  
  // ── 2. Subscription update ──────────────────────────────────────────────────
  {
    id: "ready-subscription",
    kind: "ready",
    category: "Subscription",
    name: "Subscription update",
    description: "Friendly renewal or onboarding message.",
    htmlContent: wrap(
      card(`
      <!-- Image -->
      <tr>
        <td style="padding:0;font-size:0;line-height:0;">
          <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80"
            alt="" width="600"
            style="display:block;width:100%;max-height:220px;object-fit:cover;
                   border-radius:12px 12px 0 0;" />
        </td>
      </tr>
      <!-- Headline -->
      <tr>
        <td style="padding:28px 40px 0;">
          <h1 style="margin:0;font-family:${FONT};font-size:24px;font-weight:800;
                     color:#0f172a;letter-spacing:-0.5px;">
            Your membership matters
          </h1>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;
                    line-height:1.75;color:#475569;">
            Hi {{firstName}}, thank you for being part of our community.
            Here's what's included this month and how to get the most from it.
          </p>
        </td>
      </tr>
      <!-- Value reminder card -->
      <tr>
        <td style="padding:20px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:${BRAND_LIGHT};border-radius:10px;border:1px solid #bfdbfe;">
            <tr>
              <td style="padding:20px 22px;">
                ${eyebrow("This month's value")}
                <p style="margin:0;font-family:${FONT};font-size:14px;
                          line-height:1.75;color:#1e3a8a;">
                  🎯 &nbsp;Feature unlock: Advanced analytics<br/>
                  📚 &nbsp;Resource: Monthly playbook PDF<br/>
                  💬 &nbsp;Access: Priority support queue
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 40px 36px;">
          <p style="margin:0 0 6px;font-family:${FONT};font-size:12px;color:#94a3b8;">
            Remind readers of value before any renewal ask.
          </p>
          ${pillBtn("Explore member perks")}
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 3. Newsletter digest ────────────────────────────────────────────────────
  {
    id: "ready-newsletter",
    kind: "ready",
    category: "Newsletter",
    name: "Newsletter digest",
    description: "Three short stories with dividers.",
    htmlContent: wrap(
      card(`
      <!-- Header -->
      <tr>
        <td style="padding:28px 40px 20px;background:${BRAND_PRIMARY};
                   border-radius:12px 12px 0 0;">
          ${eyebrow("Weekly digest", "#bfdbfe")}
          <h1 style="margin:0;font-family:${FONT};font-size:24px;font-weight:800;
                     color:#ffffff;letter-spacing:-0.5px;">
            This week at {{company}}
          </h1>
          <p style="margin:8px 0 0;font-family:${FONT};font-size:14px;color:#bfdbfe;">
            Hi {{firstName}}, three reads picked for you.
          </p>
        </td>
      </tr>
      <!-- Story 1 -->
      <tr>
        <td style="padding:24px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="4" style="background:${BRAND_PRIMARY};border-radius:2px;font-size:0;">
                &nbsp;
              </td>
              <td style="padding-left:14px;">
                <p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:700;
                          color:${BRAND_PRIMARY};text-transform:uppercase;letter-spacing:0.08em;">
                  Story 1
                </p>
                <h2 style="margin:0 0 6px;font-family:${FONT};font-size:17px;
                           font-weight:800;color:#0f172a;">Update one headline</h2>
                <p style="margin:0;font-family:${FONT};font-size:14px;
                          line-height:1.65;color:#475569;">
                  One paragraph summary. Keep it scannable.
                  <a href="#" style="color:${BRAND_PRIMARY};font-weight:700;text-decoration:none;">
                    Read more →
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${rule("0")}
      <!-- Story 2 -->
      <tr>
        <td style="padding:0 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="4" style="background:#e2e8f0;border-radius:2px;font-size:0;">
                &nbsp;
              </td>
              <td style="padding-left:14px;">
                <p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:700;
                          color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">
                  Story 2
                </p>
                <h2 style="margin:0 0 6px;font-family:${FONT};font-size:17px;
                           font-weight:800;color:#0f172a;">Update two headline</h2>
                <p style="margin:0;font-family:${FONT};font-size:14px;
                          line-height:1.65;color:#475569;">
                  Clear headline + one crisp paragraph per block.
                  <a href="#" style="color:${BRAND_PRIMARY};font-weight:700;text-decoration:none;">
                    Read more →
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Footer CTA -->
      <tr>
        <td style="padding:28px 40px 36px;border-top:1px solid #f1f5f9;margin-top:20px;">
          <a href="#" style="color:${BRAND_PRIMARY};font-family:${FONT};font-weight:700;
                             font-size:14px;text-decoration:none;">
            Read on the web →
          </a>
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 4. Seasonal sale ────────────────────────────────────────────────────────
  {
    id: "ready-promo",
    kind: "ready",
    category: "Promo",
    name: "Seasonal sale",
    description: "Bold promo strip, discount offer, and urgency CTA.",
    htmlContent: wrap(
      card(`
      <!-- Hero image -->
      <tr>
        <td style="padding:0;font-size:0;line-height:0;">
          <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80"
            alt="Sale" width="600"
            style="display:block;width:100%;max-height:220px;object-fit:cover;
                   border-radius:12px 12px 0 0;" />
        </td>
      </tr>
      <!-- Discount block -->
      <tr>
        <td align="center" style="padding:32px 40px 0;">
          ${eyebrow("Limited time offer")}
          <h1 style="margin:6px 0 0;font-family:${FONT};font-size:42px;font-weight:900;
                     color:#0f172a;letter-spacing:-1px;line-height:1;">
            Save <span style="color:${BRAND_PRIMARY};">25%</span> sitewide
          </h1>
          <p style="margin:14px 0 0;font-family:${FONT};font-size:15px;
                    line-height:1.65;color:#475569;">
            Hi {{firstName}}, the deal ends at midnight on Sunday.
            Use code at checkout — no minimum order.
          </p>
        </td>
      </tr>
      <!-- Code callout -->
      <tr>
        <td style="padding:20px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:#0f172a;border-radius:10px;">
            <tr>
              <td align="center" style="padding:16px 20px;">
                <span style="font-family:${FONT};font-size:11px;font-weight:700;
                             color:#64748b;letter-spacing:0.1em;text-transform:uppercase;">
                  Use code
                </span>
                <p style="margin:6px 0 0;font-family:${FONT};font-size:24px;font-weight:900;
                          color:#ffffff;letter-spacing:0.15em;">SAVE25</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td align="center" style="padding:24px 40px 36px;">
          ${pillBtn("Get the offer")}
          <p style="margin:10px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;">
            Offer expires Sunday at midnight. Cannot be combined.
          </p>
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 5. Welcome sequence ─────────────────────────────────────────────────────
  {
    id: "ready-welcome",
    kind: "ready",
    category: "Newsletter",
    name: "Welcome sequence",
    description: "Warm onboarding with numbered next steps.",
    htmlContent: wrap(
      card(`
      <!-- Top accent bar -->
      <tr>
        <td style="background:${BRAND_PRIMARY};padding:4px 0;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
      <!-- Image -->
      <tr>
        <td style="padding:0;font-size:0;line-height:0;">
          <img src="https://images.unsplash.com/photo-1486312338210-ce6712dca8cf?w=1200&q=80"
            alt="" width="600"
            style="display:block;width:100%;max-height:210px;object-fit:cover;" />
        </td>
      </tr>
      <!-- Welcome message -->
      <tr>
        <td style="padding:32px 40px 0;">
          ${eyebrow("Welcome aboard 🎉")}
          <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:800;
                     color:#0f172a;letter-spacing:-0.5px;">
            Welcome to {{company}}
          </h1>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;
                    line-height:1.75;color:#475569;">
            Hi {{firstName}}, you're in. Here's what happens next
            and where to find help when you need it.
          </p>
        </td>
      </tr>
      <!-- Steps -->
      <tr>
        <td style="padding:20px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:0 0 14px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                  style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                  <tr>
                    <td width="52" align="center" valign="middle"
                        style="padding:18px 0 18px 18px;">
                      <span style="display:inline-block;width:32px;height:32px;
                                   border-radius:50%;background:${BRAND_PRIMARY};
                                   text-align:center;line-height:32px;
                                   font-family:${FONT};font-size:14px;font-weight:800;
                                   color:#ffffff;">1</span>
                    </td>
                    <td style="padding:18px 18px 18px 12px;font-family:${FONT};
                               font-size:14px;color:#374151;">
                      <strong style="color:#0f172a;">Complete your profile</strong><br/>
                      Takes 2 minutes. Unlocks personalised features.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 14px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                  style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                  <tr>
                    <td width="52" align="center" valign="middle"
                        style="padding:18px 0 18px 18px;">
                      <span style="display:inline-block;width:32px;height:32px;
                                   border-radius:50%;background:#e2e8f0;
                                   text-align:center;line-height:32px;
                                   font-family:${FONT};font-size:14px;font-weight:800;
                                   color:#64748b;">2</span>
                    </td>
                    <td style="padding:18px 18px 18px 12px;font-family:${FONT};
                               font-size:14px;color:#374151;">
                      <strong style="color:#0f172a;">Explore the dashboard</strong><br/>
                      Your main workspace — everything starts here.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                  style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                  <tr>
                    <td width="52" align="center" valign="middle"
                        style="padding:18px 0 18px 18px;">
                      <span style="display:inline-block;width:32px;height:32px;
                                   border-radius:50%;background:#e2e8f0;
                                   text-align:center;line-height:32px;
                                   font-family:${FONT};font-size:14px;font-weight:800;
                                   color:#64748b;">3</span>
                    </td>
                    <td style="padding:18px 18px 18px 12px;font-family:${FONT};
                               font-size:14px;color:#374151;">
                      <strong style="color:#0f172a;">Book a quick tour</strong><br/>
                      15-minute call. We'll show you around personally.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:24px 40px 36px;">
          ${pillBtn("Get started now")}
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 6. Social proof ─────────────────────────────────────────────────────────
  {
    id: "ready-testimonial",
    kind: "ready",
    category: "Product",
    name: "Social proof",
    description: "Testimonial, star rating, image, and CTA.",
    htmlContent: wrap(
      card(`
      <!-- Stars -->
      <tr>
        <td style="padding:32px 40px 0;">
          <p style="margin:0 0 10px;font-size:22px;">⭐⭐⭐⭐⭐</p>
          <p style="margin:0;font-family:${FONT};font-size:20px;font-weight:700;
                    line-height:1.45;color:#0f172a;font-style:italic;">
            "This replaced three tools for our team — onboarding took an afternoon."
          </p>
          <p style="margin:14px 0 0;font-family:${FONT};font-size:14px;color:#64748b;">
            — Alex Chen, Head of Operations
          </p>
        </td>
      </tr>
      <!-- Accent bar -->
      <tr>
        <td style="padding:20px 40px 0;">
          <div style="height:4px;width:48px;background:${BRAND_PRIMARY};border-radius:2px;"></div>
        </td>
      </tr>
      <!-- Image -->
      <tr>
        <td style="padding:20px 40px 0;font-size:0;line-height:0;">
          <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80"
            alt="" width="520"
            style="display:block;width:100%;max-height:200px;object-fit:cover;border-radius:10px;" />
        </td>
      </tr>
      <!-- Stats row -->
      <tr>
        <td style="padding:20px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
            <tr>
              <td width="33%" align="center" style="padding:18px 10px;border-right:1px solid #e2e8f0;">
                <p style="margin:0;font-family:${FONT};font-size:22px;font-weight:800;
                          color:${BRAND_PRIMARY};">4,200+</p>
                <p style="margin:4px 0 0;font-family:${FONT};font-size:12px;color:#64748b;">
                  Happy teams
                </p>
              </td>
              <td width="33%" align="center" style="padding:18px 10px;border-right:1px solid #e2e8f0;">
                <p style="margin:0;font-family:${FONT};font-size:22px;font-weight:800;
                          color:${BRAND_PRIMARY};">98%</p>
                <p style="margin:4px 0 0;font-family:${FONT};font-size:12px;color:#64748b;">
                  Satisfaction
                </p>
              </td>
              <td width="33%" align="center" style="padding:18px 10px;">
                <p style="margin:0;font-family:${FONT};font-size:22px;font-weight:800;
                          color:${BRAND_PRIMARY};">5 min</p>
                <p style="margin:4px 0 0;font-family:${FONT};font-size:12px;color:#64748b;">
                  Avg. setup
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td align="center" style="padding:24px 40px 36px;">
          ${pillBtn("See customer stories")}
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 7. Company update ───────────────────────────────────────────────────────
  {
    id: "ready-announcement",
    kind: "ready",
    category: "Announcement",
    name: "Company update",
    description: "Clean update with image and shipped features list.",
    htmlContent: wrap(
      card(`
      <!-- Header -->
      <tr>
        <td style="padding:24px 40px 20px;background:#0f172a;border-radius:12px 12px 0 0;">
          ${eyebrow("From the team", "#64748b")}
          <h1 style="margin:0;font-family:${FONT};font-size:24px;font-weight:800;
                     color:#ffffff;letter-spacing:-0.5px;">
            What we shipped this month
          </h1>
        </td>
      </tr>
      <!-- Image -->
      <tr>
        <td style="padding:0;font-size:0;line-height:0;">
          <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80"
            alt="" width="600"
            style="display:block;width:100%;max-height:200px;object-fit:cover;" />
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:28px 40px 0;">
          <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.75;color:#475569;">
            Hi {{firstName}}, here's a quick look at what we've been building —
            three meaningful improvements, one sneak peek at what's next.
          </p>
        </td>
      </tr>
      <!-- Feature list -->
      <tr>
        <td style="padding:16px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;
                         font-family:${FONT};font-size:14px;color:#374151;">
                <strong style="color:${BRAND_PRIMARY};">✓</strong> &nbsp;
                <strong style="color:#0f172a;">Improvement one</strong> — Short context sentence.
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;
                         font-family:${FONT};font-size:14px;color:#374151;">
                <strong style="color:${BRAND_PRIMARY};">✓</strong> &nbsp;
                <strong style="color:#0f172a;">Improvement two</strong> — Short context sentence.
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0;font-family:${FONT};font-size:14px;color:#374151;">
                <strong style="color:#f59e0b;">→</strong> &nbsp;
                <strong style="color:#0f172a;">Coming next</strong> — What's on the roadmap.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:24px 40px 36px;">
          ${outlineBtn("Read the full changelog")}
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 8. Event spotlight ──────────────────────────────────────────────────────
  {
    id: "ready-event",
    kind: "ready",
    category: "Announcement",
    name: "Event spotlight",
    description: "Event hero, agenda timeline, and register CTA.",
    htmlContent: wrap(
      card(`
      <!-- Hero image -->
      <tr>
        <td style="padding:0;font-size:0;line-height:0;">
          <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80"
            alt="Event" width="600"
            style="display:block;width:100%;max-height:220px;object-fit:cover;
                   border-radius:12px 12px 0 0;" />
        </td>
      </tr>
      <!-- Headline -->
      <tr>
        <td style="padding:28px 40px 0;">
          ${eyebrow("Live event")}
          <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:800;
                     color:#0f172a;letter-spacing:-0.5px;">
            Join us live — it's free
          </h1>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;
                    line-height:1.75;color:#475569;">
            Hi {{firstName}}, here's the agenda, the time zone, and what you'll walk away with.
          </p>
        </td>
      </tr>
      <!-- Agenda -->
      <tr>
        <td style="padding:20px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:20px 22px;font-family:${FONT};font-size:14px;line-height:2;
                         color:#374151;">
                <span style="color:${BRAND_PRIMARY};font-weight:700;">12:00</span>
                &nbsp;—&nbsp; Welcome &amp; context<br/>
                <span style="color:${BRAND_PRIMARY};font-weight:700;">12:20</span>
                &nbsp;—&nbsp; Deep dive into the topic<br/>
                <span style="color:${BRAND_PRIMARY};font-weight:700;">12:45</span>
                &nbsp;—&nbsp; Live Q&amp;A with the team
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Date row -->
      <tr>
        <td style="padding:16px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:${BRAND_LIGHT};border-radius:8px;padding:10px 16px;
                         font-family:${FONT};font-size:14px;color:#1e3a8a;font-weight:600;">
                📅 &nbsp;Thu, Jan 15 · 12:00 PM EST · Online
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:24px 40px 36px;">
          ${pillBtn("Register — free seat")}
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 9. Resource download ────────────────────────────────────────────────────
  {
    id: "ready-resource",
    kind: "ready",
    category: "Newsletter",
    name: "Resource download",
    description: "Lead magnet layout with included items and download CTA.",
    htmlContent: wrap(
      card(`
      <!-- Header -->
      <tr>
        <td style="padding:32px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:#0f172a;border-radius:10px;padding:12px 16px;">
                <span style="font-size:28px;">📥</span>
              </td>
            </tr>
          </table>
          <h1 style="margin:16px 0 0;font-family:${FONT};font-size:26px;font-weight:800;
                     color:#0f172a;letter-spacing:-0.5px;">
            Your download is ready
          </h1>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;
                    line-height:1.75;color:#475569;">
            Hi {{firstName}}, here's exactly what you get and how it helps
            you move faster on your next project.
          </p>
        </td>
      </tr>
      <!-- Contents card -->
      <tr>
        <td style="padding:20px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:${BRAND_LIGHT};border-radius:10px;border:1px solid #bfdbfe;">
            <tr>
              <td style="padding:20px 22px;">
                ${eyebrow("What's included")}
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding:6px 0;font-family:${FONT};font-size:14px;
                               color:#1e3a8a;border-bottom:1px solid #bfdbfe;">
                      📄 &nbsp;PDF checklist — printable, A4 &amp; letter
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-family:${FONT};font-size:14px;
                               color:#1e3a8a;border-bottom:1px solid #bfdbfe;">
                      📋 &nbsp;Example templates — copy &amp; customise
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-family:${FONT};font-size:14px;color:#1e3a8a;">
                      💡 &nbsp;Bonus tips — quick wins from our experts
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:24px 40px 36px;">
          ${pillBtn("Download now")}
          <p style="margin:10px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;">
            Instant access. No account required.
          </p>
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 10. Cold outreach (NEW) ─────────────────────────────────────────────────
  {
    id: "ready-cold-outreach",
    kind: "ready",
    category: "Outreach",
    name: "Cold outreach",
    description: "Personalised first-touch for SaaS / agency prospects.",
    htmlContent: wrap(
      card(`
      <!-- Sender brand -->
      <tr>
        <td style="padding:28px 40px 0;border-bottom:1px solid #f1f5f9;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="font-family:${FONT};font-size:15px;font-weight:800;color:${BRAND_PRIMARY};">
                {{company}}
              </td>
              <td align="right" style="font-family:${FONT};font-size:12px;color:#94a3b8;">
                Personal note
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Letter body -->
      <tr>
        <td style="padding:28px 40px 0;">
          <p style="margin:0 0 16px;font-family:${FONT};font-size:16px;
                    font-weight:700;color:#0f172a;">
            Hi {{firstName}},
          </p>
          <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;
                    line-height:1.8;color:#374151;">
            I noticed <strong style="color:#0f172a;">{{prospectCompany}}</strong> is
            [specific observation — e.g. "scaling your outbound team"]. Most companies at
            your stage hit the same bottleneck: [name the pain clearly].
          </p>
          <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;
                    line-height:1.8;color:#374151;">
            We helped [similar company] solve this in [timeframe], resulting in
            [specific metric]. Happy to share exactly how.
          </p>
        </td>
      </tr>
      <!-- Social proof tag -->
      <tr>
        <td style="padding:0 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:#f8fafc;border-radius:10px;border-left:4px solid ${BRAND_PRIMARY};">
            <tr>
              <td style="padding:14px 18px;font-family:${FONT};font-size:13px;
                         color:#374151;line-height:1.6;">
                <strong style="color:#0f172a;">Used by 4,200+ teams</strong> including
                [Customer A], [Customer B], and [Customer C].
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:24px 40px 0;">
          <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;
                    line-height:1.8;color:#374151;">
            Worth a 15-minute call this week?
          </p>
          ${pillBtn("Book a quick call")}
        </td>
      </tr>
      <!-- Signature -->
      <tr>
        <td style="padding:20px 40px 36px;">
          <p style="margin:0;font-family:${FONT};font-size:14px;color:#64748b;">
            — {{senderName}}, {{senderTitle}} at {{company}}
          </p>
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 11. Case study (NEW) ────────────────────────────────────────────────────
  {
    id: "ready-case-study",
    kind: "ready",
    category: "Product",
    name: "Case study",
    description: "Before / after results with metrics and link to full story.",
    htmlContent: wrap(
      card(`
      <!-- Header -->
      <tr>
        <td style="padding:0;font-size:0;line-height:0;">
          <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80"
            alt="Case study" width="600"
            style="display:block;width:100%;max-height:220px;object-fit:cover;
                   border-radius:12px 12px 0 0;" />
        </td>
      </tr>
      <tr>
        <td style="padding:28px 40px 0;">
          ${eyebrow("Customer story")}
          <h1 style="margin:0;font-family:${FONT};font-size:24px;font-weight:800;
                     color:#0f172a;letter-spacing:-0.5px;">
            How [Customer] grew 3× in 90 days
          </h1>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;
                    line-height:1.75;color:#475569;">
            Hi {{firstName}}, here's a quick look at the results [Customer]
            achieved — and how they did it.
          </p>
        </td>
      </tr>
      <!-- Metrics row -->
      <tr>
        <td style="padding:20px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:#0f172a;border-radius:10px;">
            <tr>
              <td width="33%" align="center"
                  style="padding:20px 10px;border-right:1px solid #1e293b;">
                <p style="margin:0;font-family:${FONT};font-size:28px;font-weight:900;
                          color:${BRAND_PRIMARY};">3×</p>
                <p style="margin:4px 0 0;font-family:${FONT};font-size:11px;
                          color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">
                  Growth
                </p>
              </td>
              <td width="33%" align="center"
                  style="padding:20px 10px;border-right:1px solid #1e293b;">
                <p style="margin:0;font-family:${FONT};font-size:28px;font-weight:900;
                          color:${BRAND_PRIMARY};">-40%</p>
                <p style="margin:4px 0 0;font-family:${FONT};font-size:11px;
                          color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">
                  Churn
                </p>
              </td>
              <td width="33%" align="center" style="padding:20px 10px;">
                <p style="margin:0;font-family:${FONT};font-size:28px;font-weight:900;
                          color:${BRAND_PRIMARY};">90d</p>
                <p style="margin:4px 0 0;font-family:${FONT};font-size:11px;
                          color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">
                  Timeline
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Quote -->
      <tr>
        <td style="padding:20px 40px 0;">
          <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.65;
                    color:#475569;font-style:italic;">
            "One short, powerful sentence from the customer that captures
            the transformation they experienced."
          </p>
          <p style="margin:8px 0 0;font-family:${FONT};font-size:13px;
                    font-weight:700;color:${BRAND_PRIMARY};">
            — Name, Title at Company
          </p>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:24px 40px 36px;">
          ${pillBtn("Read the full story")}
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 12. Pricing / upgrade (NEW) ─────────────────────────────────────────────
  {
    id: "ready-pricing-upgrade",
    kind: "ready",
    category: "Subscription",
    name: "Pricing / upgrade",
    description: "Upgrade nudge with plan comparison and CTA.",
    htmlContent: wrap(
      card(`
      <!-- Header -->
      <tr>
        <td style="padding:32px 40px 0;">
          ${eyebrow("Upgrade your plan")}
          <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:800;
                     color:#0f172a;letter-spacing:-0.5px;">
            You're outgrowing your current plan
          </h1>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;
                    line-height:1.75;color:#475569;">
            Hi {{firstName}}, based on your usage you're close to the limit.
            Here's what unlocks when you upgrade.
          </p>
        </td>
      </tr>
      <!-- Plan comparison -->
      <tr>
        <td style="padding:20px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <!-- Current -->
              <td width="48%" valign="top" style="padding-right:8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                  style="border:1px solid #e2e8f0;border-radius:10px;">
                  <tr>
                    <td align="center"
                        style="padding:16px;border-bottom:1px solid #f1f5f9;
                               background:#f8fafc;border-radius:10px 10px 0 0;">
                      <p style="margin:0;font-family:${FONT};font-size:11px;font-weight:700;
                                color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">
                        Current
                      </p>
                      <p style="margin:6px 0 0;font-family:${FONT};font-size:20px;
                                font-weight:800;color:#0f172a;">Starter</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px;font-family:${FONT};font-size:13px;
                               color:#64748b;line-height:1.8;">
                      ✓ &nbsp;5 seats<br/>
                      ✓ &nbsp;10 projects<br/>
                      ✗ &nbsp;<span style="text-decoration:line-through;">Analytics</span><br/>
                      ✗ &nbsp;<span style="text-decoration:line-through;">API access</span>
                    </td>
                  </tr>
                </table>
              </td>
              <!-- Pro -->
              <td width="48%" valign="top" style="padding-left:8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                  style="border:2px solid ${BRAND_PRIMARY};border-radius:10px;">
                  <tr>
                    <td align="center"
                        style="padding:16px;border-bottom:1px solid ${BRAND_PRIMARY};
                               background:${BRAND_PRIMARY};border-radius:8px 8px 0 0;">
                      <p style="margin:0;font-family:${FONT};font-size:11px;font-weight:700;
                                color:#bfdbfe;text-transform:uppercase;letter-spacing:0.08em;">
                        Upgrade to
                      </p>
                      <p style="margin:6px 0 0;font-family:${FONT};font-size:20px;
                                font-weight:800;color:#ffffff;">Pro</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px;font-family:${FONT};font-size:13px;
                               color:#374151;line-height:1.8;">
                      ✓ &nbsp;Unlimited seats<br/>
                      ✓ &nbsp;Unlimited projects<br/>
                      ✓ &nbsp;<strong style="color:#0f172a;">Advanced analytics</strong><br/>
                      ✓ &nbsp;<strong style="color:#0f172a;">Full API access</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:24px 40px 36px;">
          ${pillBtn("Upgrade to Pro")}
          <p style="margin:10px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;">
            Prorated billing. Upgrade or downgrade any time.
          </p>
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 13. Re-engagement (NEW) ─────────────────────────────────────────────────
  {
    id: "ready-reengagement",
    kind: "ready",
    category: "Outreach",
    name: "Re-engagement",
    description: "Win back inactive users with an honest, friendly note.",
    htmlContent: wrap(
      card(`
      <!-- Emotional header -->
      <tr>
        <td align="center" style="padding:40px 40px 0;">
          <p style="margin:0;font-size:48px;">👋</p>
          <h1 style="margin:12px 0 0;font-family:${FONT};font-size:26px;font-weight:800;
                     color:#0f172a;letter-spacing:-0.5px;">
            We miss you, {{firstName}}
          </h1>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;
                    line-height:1.75;color:#475569;">
            It's been a while. We've shipped a lot since you last logged in — 
            here's a peek at what's new.
          </p>
        </td>
      </tr>
      <!-- What's new -->
      <tr>
        <td style="padding:20px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:20px 22px;font-family:${FONT};font-size:14px;
                         line-height:1.8;color:#374151;">
                ${eyebrow("New since you left")}
                🚀 &nbsp;<strong style="color:#0f172a;">Feature A</strong> — one-sentence benefit<br/>
                📊 &nbsp;<strong style="color:#0f172a;">Feature B</strong> — one-sentence benefit<br/>
                🤝 &nbsp;<strong style="color:#0f172a;">Feature C</strong> — one-sentence benefit
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Offer -->
      <tr>
        <td style="padding:16px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:${BRAND_LIGHT};border-radius:10px;border:1px solid #bfdbfe;">
            <tr>
              <td style="padding:16px 20px;font-family:${FONT};font-size:14px;
                         color:#1e3a8a;line-height:1.6;">
                <strong style="color:${BRAND_PRIMARY};">Special offer:</strong>
                Come back this week and get 2 months free on any annual plan.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td align="center" style="padding:24px 40px 36px;">
          ${pillBtn("Come back and explore")}
          <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;">
            No strings attached. Cancel any time.
          </p>
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── 14. Referral program (NEW) ──────────────────────────────────────────────
  {
    id: "ready-referral",
    kind: "ready",
    category: "Outreach",
    name: "Referral program",
    description: "Invite friends, earn rewards — shareable referral email.",
    htmlContent: wrap(
      card(`
      <!-- Header -->
      <tr>
        <td align="center" style="padding:36px 40px 0;">
          <p style="margin:0;font-size:40px;">🎁</p>
          ${eyebrow("Refer a friend")}
          <h1 style="margin:6px 0 0;font-family:${FONT};font-size:26px;font-weight:800;
                     color:#0f172a;letter-spacing:-0.5px;">
            Share {{company}}, earn $50
          </h1>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;
                    line-height:1.75;color:#475569;">
            Hi {{firstName}}, for every friend who signs up using your link,
            you both get $50 off your next bill.
          </p>
        </td>
      </tr>
      <!-- How it works -->
      <tr>
        <td style="padding:24px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" width="33%" valign="top" style="padding:0 6px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                  style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                  <tr>
                    <td align="center" style="padding:20px 12px;">
                      <p style="margin:0 0 8px;font-size:22px;">🔗</p>
                      <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;
                                color:#0f172a;">Share your link</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="center" width="33%" valign="top" style="padding:0 6px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                  style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                  <tr>
                    <td align="center" style="padding:20px 12px;">
                      <p style="margin:0 0 8px;font-size:22px;">✅</p>
                      <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;
                                color:#0f172a;">They sign up</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="center" width="33%" valign="top" style="padding:0 6px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                  style="background:${BRAND_PRIMARY};border-radius:10px;">
                  <tr>
                    <td align="center" style="padding:20px 12px;">
                      <p style="margin:0 0 8px;font-size:22px;">💰</p>
                      <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;
                                color:#ffffff;">You both earn $50</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Referral link box -->
      <tr>
        <td style="padding:20px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:#f8fafc;border-radius:10px;border:1px dashed #cbd5e1;">
            <tr>
              <td style="padding:14px 18px;">
                <p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:700;
                          color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">
                  Your referral link
                </p>
                <p style="margin:0;font-family:${FONT};font-size:13px;color:${BRAND_PRIMARY};
                          word-break:break-all;">
                  {{referralUrl}}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td align="center" style="padding:24px 40px 36px;">
          ${pillBtn("Copy my referral link")}
          <p style="margin:10px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;">
            No limit on referrals. Credits applied within 48 hours.
          </p>
        </td>
      </tr>
      ${footer()}`)
    ),
  },

  // ── R1. Trial expiry — urgency (long-form) ──────────────────────────────────
  {
    id: "ready-trial-expiry",
    kind: "ready",
    category: "Subscription",
    name: "Trial expiry",
    description: "3-day trial-ending urgency email with value recap and upgrade CTA.",
    htmlContent: wrap(card(`
    <!-- Urgency banner -->
    <tr>
      <td style="background:#dc2626;padding:14px 32px;text-align:center;">
        <p style="margin:0;font-family:${FONT};font-size:13px;font-weight:700;
                  color:#ffffff;letter-spacing:0.06em;">
          ⏳ &nbsp; YOUR TRIAL ENDS IN 3 DAYS
        </p>
      </td>
    </tr>

    <!-- Header -->
    <tr>
      <td style="padding:32px 40px 0;">
        ${eye("Don't lose access")}
        <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:800;
                   color:${DARK};letter-spacing:-0.5px;">
          Everything you've built is still here, {{firstName}}
        </h1>
        <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.8;color:${MID};">
          Your trial wraps up on <strong style="color:${DARK};">{{trialEndDate}}</strong>.
          Upgrade now to keep all your data, workflows, and team members — plus unlock
          the features that are still locked on the trial.
        </p>
      </td>
    </tr>

    <!-- What you've done -->
    <tr>
      <td style="padding:24px 40px 0;">
        ${eye("Your trial activity")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:#0f172a;border-radius:12px;">
          <tr>
            ${stat("{{projectsCreated}}", "Projects")}
            <td width="1" style="background:#1e293b;font-size:0;">&nbsp;</td>
            ${stat("{{teamMembers}}", "Team members")}
            <td width="1" style="background:#1e293b;font-size:0;">&nbsp;</td>
            ${stat("{{actionsRun}}", "Actions run")}
          </tr>
        </table>
      </td>
    </tr>

    <!-- Value recap -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:10px;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:20px 22px;">
              ${eye("What you'll keep")}
              <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.8;color:${MID};">
                ✓ &nbsp;All projects and data<br/>
                ✓ &nbsp;Every workflow you've built<br/>
                ✓ &nbsp;Your team's seats and permissions<br/>
                ✓ &nbsp;Full audit log and history
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Offer callout -->
    <tr>
      <td style="padding:16px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${BRAND_LIGHT};border-radius:10px;border:1px solid #bfdbfe;">
          <tr>
            <td style="padding:16px 20px;font-family:${FONT};font-size:14px;
                       line-height:1.65;color:#1e3a8a;">
              <strong style="color:${BRAND_PRIMARY};">Trial offer:</strong>
              Upgrade within 3 days and get your first 2 months at 20% off.
              Use code <strong>KEEP20</strong> at checkout.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Pricing snapshot -->
    <tr>
      <td style="padding:20px 40px 0;">
        <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td width="255" valign="top"><![endif]-->
        <div style="display:inline-block;vertical-align:top;width:48%;min-width:200px;
                    padding-right:8px;box-sizing:border-box;">
          ${tierCard("Starter", "$29", "mo", [
            "Up to 5 seats",
            "20 projects",
            "Core integrations",
            "Email support",
          ])}
        </div><!--[if mso]></td><td width="10">&nbsp;</td><td width="255" valign="top"><![endif]-->
        <div style="display:inline-block;vertical-align:top;width:48%;min-width:200px;
                    padding-left:8px;box-sizing:border-box;">
          ${tierCard("Growth", "$79", "mo", [
            "Unlimited seats",
            "Unlimited projects",
            "All integrations + API",
            "Priority support",
          ], true)}
        </div>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:28px 40px 36px;">
        ${pillBtn("Upgrade before trial ends")}
        <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;">
          No credit card stored during trial. Cancel any time after upgrade.
        </p>
      </td>
    </tr>
    ${footer()}`)
    ),
  },

  // ── R2. Post-demo follow-up ─────────────────────────────────────────────────
  {
    id: "ready-demo-followup",
    kind: "ready",
    category: "Outreach",
    name: "Post-demo follow-up",
    description: "Warm, structured follow-up after a sales demo call.",
    htmlContent: wrap(card(`
    <!-- Brand header -->
    <tr>
      <td style="padding:28px 40px 20px;border-bottom:1px solid ${BORDER};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="font-family:${FONT};font-size:15px;font-weight:800;color:${BRAND_PRIMARY};">
              {{company}}
            </td>
            <td align="right" style="font-family:${FONT};font-size:12px;color:${MUTED};">
              Post-demo summary
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Opening -->
    <tr>
      <td style="padding:28px 40px 0;">
        <p style="margin:0 0 16px;font-family:${FONT};font-size:16px;font-weight:700;color:${DARK};">
          Hi {{firstName}},
        </p>
        <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.8;color:${MID};">
          Thanks for taking the time to meet with us today. Here's a quick summary
          of what we covered, plus the next steps we agreed on.
        </p>
      </td>
    </tr>

    <!-- What we covered -->
    <tr>
      <td style="padding:0 40px 0;">
        ${eye("What we covered")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:10px;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:18px 20px;font-family:${FONT};font-size:14px;
                       line-height:1.8;color:${MID};">
              ✓ &nbsp;<strong style="color:${DARK};">Your current workflow</strong>
              — [Summarise what the prospect told you]<br/>
              ✓ &nbsp;<strong style="color:${DARK};">Key pain points</strong>
              — [Pain 1], [Pain 2]<br/>
              ✓ &nbsp;<strong style="color:${DARK};">Features demoed</strong>
              — [Feature A], [Feature B], [Feature C]<br/>
              ✓ &nbsp;<strong style="color:${DARK};">ROI estimate</strong>
              — [Your specific number based on their context]
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="padding:20px 40px 0;">${divider()}</td></tr>

    <!-- Next steps -->
    <tr>
      <td style="padding:0 40px 0;">
        ${eye("Agreed next steps")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${BORDER};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="28" valign="top" style="padding-top:2px;">
                    <span style="display:inline-block;width:20px;height:20px;border-radius:50%;
                      background:${BRAND_PRIMARY};text-align:center;line-height:20px;
                      font-family:${FONT};font-size:11px;font-weight:800;color:#ffffff;">1</span>
                  </td>
                  <td style="padding-left:8px;font-family:${FONT};font-size:14px;color:${MID};">
                    <strong style="color:${DARK};">{{firstName}}</strong> —
                    Share this email with your team by [date].
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${BORDER};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="28" valign="top" style="padding-top:2px;">
                    <span style="display:inline-block;width:20px;height:20px;border-radius:50%;
                      background:#e2e8f0;text-align:center;line-height:20px;
                      font-family:${FONT};font-size:11px;font-weight:800;color:${MUTED};">2</span>
                  </td>
                  <td style="padding-left:8px;font-family:${FONT};font-size:14px;color:${MID};">
                    <strong style="color:${DARK};">{{senderName}}</strong> —
                    Send over the security questionnaire by [date].
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="28" valign="top" style="padding-top:2px;">
                    <span style="display:inline-block;width:20px;height:20px;border-radius:50%;
                      background:#e2e8f0;text-align:center;line-height:20px;
                      font-family:${FONT};font-size:11px;font-weight:800;color:${MUTED};">3</span>
                  </td>
                  <td style="padding-left:8px;font-family:${FONT};font-size:14px;color:${MID};">
                    <strong style="color:${DARK};">Both</strong> —
                    Follow-up call on [date] to finalise proposal.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Resources -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${BRAND_LIGHT};border-radius:10px;border:1px solid #bfdbfe;">
          <tr>
            <td style="padding:16px 20px;">
              ${eye("Helpful resources")}
              <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.8;color:#1e3a8a;">
                📄 &nbsp;
                <a href="#" style="color:${BRAND_PRIMARY};font-weight:700;text-decoration:none;">
                  Customer case study (PDF)
                </a><br/>
                📋 &nbsp;
                <a href="#" style="color:${BRAND_PRIMARY};font-weight:700;text-decoration:none;">
                  Security &amp; compliance overview
                </a><br/>
                🎥 &nbsp;
                <a href="#" style="color:${BRAND_PRIMARY};font-weight:700;text-decoration:none;">
                  Recording of today's demo
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA + signature -->
    <tr>
      <td style="padding:24px 40px 0;">
        ${pillBtn("Book our follow-up call")}
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 36px;">
        <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.75;color:${MUTED};">
          Questions before our call? Reply directly to this email or reach me on
          <a href="#" style="color:${BRAND_PRIMARY};font-weight:700;text-decoration:none;">
            LinkedIn
          </a>.
          <br/><br/>
          — {{senderName}}, {{senderTitle}}<br/>
          <span style="color:#94a3b8;">{{senderPhone}} · {{company}}</span>
        </p>
      </td>
    </tr>
    ${footer()}`)),
  },

  // ── R3. Feature launch (long-form) ──────────────────────────────────────────
  {
    id: "ready-feature-launch",
    kind: "ready",
    category: "Announcement",
    name: "Feature launch",
    description: "Full-length new feature announcement with changelog, screenshots, and CTA.",
    htmlContent: wrap(card(`
    <!-- Hero image -->
    <tr>
      <td style="padding:0;font-size:0;line-height:0;">
        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80"
          alt="Feature launch" width="600"
          style="display:block;width:100%;max-height:240px;object-fit:cover;
                 border-radius:12px 12px 0 0;" />
      </td>
    </tr>

    <!-- Launch badge + headline -->
    <tr>
      <td style="padding:28px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#059669;border-radius:999px;padding:4px 12px;">
              <span style="font-family:${FONT};font-size:11px;font-weight:700;color:#ffffff;
                           letter-spacing:0.08em;text-transform:uppercase;">
                🚀 &nbsp;Live now
              </span>
            </td>
          </tr>
        </table>
        <h1 style="margin:14px 0 0;font-family:${FONT};font-size:28px;font-weight:900;
                   color:${DARK};letter-spacing:-0.5px;line-height:1.2;">
          [Feature Name] is here
        </h1>
        <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.8;color:${MID};">
          Hi {{firstName}}, today we're shipping something the community has been asking for.
          Here's everything you need to know — and how to turn it on right now.
        </p>
      </td>
    </tr>

    <!-- Why we built it -->
    <tr>
      <td style="padding:24px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:10px;border-left:4px solid ${BRAND_PRIMARY};">
          <tr>
            <td style="padding:18px 20px;font-family:${FONT};font-size:14px;
                       line-height:1.75;color:${MID};">
              <strong style="color:${DARK};">Why we built this:</strong>
              You told us [the pain]. Every week, teams were spending [X hours] on [manual task].
              This ships a permanent fix — no workarounds, no exports, no wasted time.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- What's new list -->
    <tr>
      <td style="padding:24px 40px 0;">
        ${eye("What's new")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${featureRow("🎯", "Core capability #1", "One sentence on what this does and why it matters. Be specific.")}
          ${featureRow("⚡", "Core capability #2", "One sentence on what this does and why it matters. Be specific.")}
          ${featureRow("🔗", "Core capability #3", "One sentence on what this does and why it matters. Be specific.")}
          ${featureRow("📊", "Analytics &amp; reporting", "Built-in dashboards so you can measure impact from day one.")}
        </table>
      </td>
    </tr>

    <!-- Screenshot placeholder -->
    <tr>
      <td style="padding:24px 40px 0;">
        ${eye("See it in action")}
        <div style="background:#f1f5f9;border-radius:12px;height:180px;border:1px solid ${BORDER};
                    text-align:center;line-height:180px;">
          <span style="font-family:${FONT};font-size:12px;color:#94a3b8;
                       text-transform:uppercase;letter-spacing:0.08em;">
            Product screenshot / GIF
          </span>
        </div>
      </td>
    </tr>

    <!-- Customer quote -->
    <tr>
      <td style="padding:24px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${DARK};border-radius:10px;">
          <tr>
            <td style="padding:24px 26px;">
              <p style="margin:0 0 10px;font-size:20px;">⭐⭐⭐⭐⭐</p>
              <p style="margin:0 0 10px;font-family:${FONT};font-size:16px;line-height:1.6;
                        color:#e2e8f0;font-style:italic;">
                "We tested this with our team during beta. [Specific, credible outcome].
                Worth every penny."
              </p>
              <p style="margin:0;font-family:${FONT};font-size:13px;
                        font-weight:700;color:${BRAND_PRIMARY};">
                — Beta tester name, Title at Company
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Plan availability -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${BRAND_LIGHT};border-radius:10px;border:1px solid #bfdbfe;">
          <tr>
            <td style="padding:16px 20px;">
              ${eye("Availability")}
              <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.75;color:#1e3a8a;">
                ${chip("All plans", BRAND_LIGHT, BRAND_PRIMARY)} &nbsp;
                [Core feature A] — free for everyone<br/><br/>
                ${chip("Growth +", "#0f172a", "#ffffff")} &nbsp;
                [Advanced feature B] — Growth and above
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:28px 40px 0;">
        ${pillBtn("Try it now")}
        &nbsp;&nbsp;
        ${ghostBtn("Read the docs")}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 36px;">
        <p style="margin:0;font-family:${FONT};font-size:13px;color:${MUTED};">
          Questions? Join our live walkthrough on
          <a href="#" style="color:${BRAND_PRIMARY};font-weight:700;text-decoration:none;">
            Thursday at 12 PM EST →
          </a>
        </p>
      </td>
    </tr>
    ${footer()}`)),
  },

  // ── R4. Day-1 onboarding drip ───────────────────────────────────────────────
  {
    id: "ready-onboarding-day1",
    kind: "ready",
    category: "Newsletter",
    name: "Onboarding day 1",
    description: "First drip email in an onboarding sequence — orient, activate, encourage.",
    htmlContent: wrap(card(`
    <!-- Green success bar -->
    <tr>
      <td style="background:#059669;padding:14px 32px;text-align:center;">
        <p style="margin:0;font-family:${FONT};font-size:13px;font-weight:700;color:#ffffff;">
          ✓ &nbsp; Your account is live — here's how to get your first win today
        </p>
      </td>
    </tr>

    <!-- Opening -->
    <tr>
      <td style="padding:32px 40px 0;">
        <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:800;
                   color:${DARK};letter-spacing:-0.5px;">
          Day 1 — let's get you your first result
        </h1>
        <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.8;color:${MID};">
          Hi {{firstName}}, welcome to {{company}}. Over the next few days I'll send you
          short, focused emails — each one designed to get you one real win.
          Today: your first workflow in 10 minutes.
        </p>
      </td>
    </tr>

    <!-- Today's goal -->
    <tr>
      <td style="padding:24px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${DARK};border-radius:12px;">
          <tr>
            <td style="padding:24px 26px;">
              ${eye("Today's goal", "#64748b")}
              <p style="margin:0;font-family:${FONT};font-size:20px;font-weight:800;
                        color:#ffffff;letter-spacing:-0.3px;">
                Complete your first automated workflow
              </p>
              <p style="margin:8px 0 0;font-family:${FONT};font-size:14px;
                        line-height:1.65;color:#94a3b8;">
                Estimated time: 10 minutes. No code, no IT tickets.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Step-by-step (compact) -->
    <tr>
      <td style="padding:24px 40px 0;">
        ${eye("Your 10-minute plan")}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="margin-bottom:10px;background:${BRAND_LIGHT};border-radius:8px;">
          <tr>
            <td width="44" align="center" valign="middle" style="padding:14px 0 14px 14px;">
              ${badge(1)}
            </td>
            <td style="padding:14px 14px 14px 10px;font-family:${FONT};font-size:14px;color:#1e3a8a;">
              <strong style="color:${DARK};">Open the Workflows tab</strong>
              in your dashboard (top nav, second item).
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="margin-bottom:10px;background:${SURFACE};border-radius:8px;border:1px solid ${BORDER};">
          <tr>
            <td width="44" align="center" valign="middle" style="padding:14px 0 14px 14px;">
              ${badge(2, false)}
            </td>
            <td style="padding:14px 14px 14px 10px;font-family:${FONT};font-size:14px;color:${MID};">
              <strong style="color:${DARK};">Click "New from template"</strong>
              and choose the starter template that matches your use case.
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:8px;border:1px solid ${BORDER};">
          <tr>
            <td width="44" align="center" valign="middle" style="padding:14px 0 14px 14px;">
              ${badge(3, false)}
            </td>
            <td style="padding:14px 14px 14px 10px;font-family:${FONT};font-size:14px;color:${MID};">
              <strong style="color:${DARK};">Hit "Publish"</strong>
              — your workflow goes live and runs automatically from here.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Progress bar section -->
    <tr>
      <td style="padding:24px 40px 0;">
        ${eye("Your setup progress")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:10px;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 14px;">${progressBar(33, "Profile complete")}</p>
              <p style="margin:0 0 14px;">${progressBar(0, "First workflow published")}</p>
              <p style="margin:0;">${progressBar(0, "Team member invited")}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Help nudge -->
    <tr>
      <td style="padding:16px 40px 0;">
        <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.65;color:${MUTED};">
          Stuck? Our team is in your corner.
          <a href="#" style="color:${BRAND_PRIMARY};font-weight:700;text-decoration:none;">
            Open live chat →
          </a>
          &nbsp; Average response: under 2 minutes.
        </p>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:24px 40px 36px;">
        ${pillBtn("Open my dashboard →")}
        <p style="margin:10px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;">
          Tomorrow: how to invite your team and share your first report.
        </p>
      </td>
    </tr>
    ${footer()}`)),
  },

  // ── R5. Churn prevention ────────────────────────────────────────────────────
  {
    id: "ready-churn-prevention",
    kind: "ready",
    category: "Subscription",
    name: "Churn prevention",
    description: "Re-engage users with declining usage before they cancel.",
    htmlContent: wrap(card(`
    <!-- Soft header — no alarm, just honesty -->
    <tr>
      <td style="padding:32px 40px 0;">
        ${eye("A quick check-in")}
        <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:800;
                   color:${DARK};letter-spacing:-0.5px;">
          {{firstName}}, we noticed you've gone quiet
        </h1>
        <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.8;color:${MID};">
          Your last login was <strong style="color:${DARK};">{{daysSinceLogin}} days ago</strong>.
          That's unusual for you — and we want to make sure {{company}} is actually
          working the way you need it to.
        </p>
      </td>
    </tr>

    <!-- Usage snapshot -->
    <tr>
      <td style="padding:24px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:10px;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:20px 22px;">
              ${eye("Your account, at a glance")}
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid ${BORDER};
                             font-family:${FONT};font-size:14px;color:${MID};">
                    <strong style="color:${DARK};">Plan</strong>
                    <span style="float:right;">{{planName}}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid ${BORDER};
                             font-family:${FONT};font-size:14px;color:${MID};">
                    <strong style="color:${DARK};">Next billing date</strong>
                    <span style="float:right;">{{nextBillingDate}}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-family:${FONT};font-size:14px;color:${MID};">
                    <strong style="color:${DARK};">Features not yet used</strong>
                    <span style="float:right;color:#dc2626;font-weight:700;">{{unusedFeatureCount}}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Hidden value -->
    <tr>
      <td style="padding:20px 40px 0;">
        ${eye("Features you haven't tried yet")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${featureRow("📊", "Advanced reporting", "Export any view to PDF or Sheets in one click. Most users save 3 hours/week.")}
          ${featureRow("🤖", "Automation rules", "Set it once, run forever. Eliminate the most repetitive part of your workflow.")}
          ${featureRow("👥", "Team collaboration", "Comment, assign, and track — everything in one place, no email chains.")}
        </table>
      </td>
    </tr>

    <!-- Honest offer -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${BRAND_LIGHT};border-radius:10px;border:1px solid #bfdbfe;">
          <tr>
            <td style="padding:18px 20px;font-family:${FONT};font-size:14px;
                       line-height:1.65;color:#1e3a8a;">
              <strong style="color:${BRAND_PRIMARY};">We'd love to help.</strong>
              Book a 20-minute session with your Customer Success manager and we'll
              map {{company}}'s features directly to your team's workflow — or tell you
              honestly if there's a better fit elsewhere.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Dual CTA -->
    <tr>
      <td style="padding:24px 40px 0;">
        ${pillBtn("Book a 20-min session")}
        &nbsp;&nbsp;
        ${ghostBtn("Log in to my account")}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 36px;">
        <p style="margin:0;font-family:${FONT};font-size:13px;color:${MUTED};">
          If you've decided to move on, no hard feelings —
          <a href="{{cancelUrl}}" style="color:${MUTED};text-decoration:underline;">
            cancel anytime here
          </a>.
        </p>
      </td>
    </tr>
    ${footer()}`)),
  },

  // ── R6. Monthly value report ────────────────────────────────────────────────
  {
    id: "ready-monthly-report",
    kind: "ready",
    category: "Newsletter",
    name: "Monthly value report",
    description: "Personalised monthly usage summary — reinforce value, reduce churn.",
    htmlContent: wrap(card(`
    <!-- Header — dark and minimal -->
    <tr>
      <td style="padding:28px 40px 20px;background:${DARK};border-radius:12px 12px 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td>
              <p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:700;
                        color:#475569;text-transform:uppercase;letter-spacing:0.12em;">
                {{monthName}} report
              </p>
              <h1 style="margin:0;font-family:${FONT};font-size:24px;font-weight:800;
                         color:#ffffff;letter-spacing:-0.5px;">
                Your team's month in numbers
              </h1>
            </td>
            <td align="right" valign="middle">
              <span style="font-family:${FONT};font-size:13px;font-weight:700;
                           color:${BRAND_PRIMARY};">{{company}}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Stats grid -->
    <tr>
      <td style="padding:24px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:10px;border:1px solid ${BORDER};">
          <tr>
            ${stat("{{tasksDone}}", "Tasks completed")}
            <td width="1" style="background:${BORDER};font-size:0;">&nbsp;</td>
            ${stat("{{timeSaved}}h", "Hours saved")}
            <td width="1" style="background:${BORDER};font-size:0;">&nbsp;</td>
            ${stat("{{activeUsers}}", "Active users")}
          </tr>
        </table>
      </td>
    </tr>

    <!-- Progress bars -->
    <tr>
      <td style="padding:20px 40px 0;">
        ${eye("Plan usage")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:10px;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 14px;">${progressBar(68, "Storage — 6.8 GB of 10 GB")}</p>
              <p style="margin:0 0 14px;">${progressBar(45, "API calls — 4,500 of 10,000")}</p>
              <p style="margin:0;">${progressBar(90, "Team seats — 9 of 10 used")}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Top activity -->
    <tr>
      <td style="padding:20px 40px 0;">
        ${eye("Most used this month")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${BORDER};
                       font-family:${FONT};font-size:14px;color:${MID};">
              <strong style="color:${DARK};">🏆 Reporting</strong>
              <span style="float:right;color:${BRAND_PRIMARY};font-weight:700;">
                {{reportViews}} views
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${BORDER};
                       font-family:${FONT};font-size:14px;color:${MID};">
              <strong style="color:${DARK};">2. Automation</strong>
              <span style="float:right;color:${MUTED};font-weight:700;">
                {{automationRuns}} runs
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-family:${FONT};font-size:14px;color:${MID};">
              <strong style="color:${DARK};">3. Integrations</strong>
              <span style="float:right;color:${MUTED};font-weight:700;">
                {{integrationSyncs}} syncs
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Tip -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${BRAND_LIGHT};border-radius:10px;border:1px solid #bfdbfe;">
          <tr>
            <td style="padding:16px 20px;font-family:${FONT};font-size:14px;
                       line-height:1.65;color:#1e3a8a;">
              💡 &nbsp;<strong>Tip of the month:</strong>
              You have {{unusedSeatCount}} unused seats. Invite your team and you'll
              see a 40% faster turnaround on collaborative tasks.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:24px 40px 36px;">
        ${pillBtn("View full report")}
        &nbsp;&nbsp;
        <a href="#" style="font-family:${FONT};font-size:14px;font-weight:700;
                           color:${MUTED};text-decoration:none;">
          Upgrade plan →
        </a>
      </td>
    </tr>
    ${footer()}`)),
  },

  // ── R7. Abandoned signup ────────────────────────────────────────────────────
  {
    id: "ready-abandoned-signup",
    kind: "ready",
    category: "Outreach",
    name: "Abandoned signup",
    description: "Recovery email for users who started but didn't complete registration.",
    htmlContent: wrap(card(`
    <!-- Header -->
    <tr>
      <td align="center" style="padding:36px 40px 0;">
        <p style="margin:0 0 12px;font-size:40px;">🔑</p>
        ${eye("You were so close")}
        <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:800;
                   color:${DARK};letter-spacing:-0.5px;">
          Your account is waiting, {{firstName}}
        </h1>
        <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.8;color:${MID};">
          You started signing up for {{company}} but didn't quite finish.
          Your spot is reserved — it takes 60 seconds to complete.
        </p>
      </td>
    </tr>

    <!-- What they're missing -->
    <tr>
      <td style="padding:24px 40px 0;">
        ${eye("What's waiting for you")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${featureRow("🎁", "14-day free trial — full access", "Every feature, every integration. No credit card needed.")}
          ${featureRow("⚡", "Set up in under 5 minutes", "Our wizard walks you through it step by step.")}
          ${featureRow("🤝", "Dedicated onboarding session", "A real human to get you started right.")}
        </table>
      </td>
    </tr>

    <!-- Social proof -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${DARK};border-radius:10px;">
          <tr>
            <td style="padding:20px 22px;">
              <p style="margin:0 0 8px;font-family:${FONT};font-size:15px;
                        line-height:1.6;color:#e2e8f0;font-style:italic;">
                "I almost didn't sign up. Three hours after I did, I had my first workflow running.
                Game-changer for our team."
              </p>
              <p style="margin:0;font-family:${FONT};font-size:13px;
                        font-weight:700;color:${BRAND_PRIMARY};">
                — Recent customer, Growth plan
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Objection handling -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:10px;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:18px 20px;font-family:${FONT};font-size:14px;
                       line-height:1.8;color:${MID};">
              <strong style="color:${DARK};">Worried about the commitment?</strong><br/>
              No credit card. No auto-charge. Cancel at any point during the trial
              with zero questions asked.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td align="center" style="padding:28px 40px 36px;">
        ${pillBtn("Complete my signup — it's free")}
        <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;">
          Your progress has been saved. Just click to continue.
        </p>
      </td>
    </tr>
    ${footer()}`)),
  },

  // ── R8. Competitor comparison ───────────────────────────────────────────────
  {
    id: "ready-competitor-compare",
    kind: "ready",
    category: "Outreach",
    name: "Competitor comparison",
    description: "Side-by-side feature comparison against a named competitor.",
    htmlContent: wrap(card(`
    <!-- Header -->
    <tr>
      <td style="padding:32px 40px 0;">
        ${eye("Switching from [Competitor]?")}
        <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:800;
                   color:${DARK};letter-spacing:-0.5px;">
          Here's the honest comparison
        </h1>
        <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.8;color:${MID};">
          Hi {{firstName}}, we know you're evaluating your options.
          Here's a straight look at how we stack up —
          no spin, just the specifics that matter for teams like yours.
        </p>
      </td>
    </tr>

    <!-- Comparison table -->
    <tr>
      <td style="padding:24px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="border-radius:10px;border:1px solid ${BORDER};overflow:hidden;">

          <!-- Header row -->
          <tr>
            <td width="44%" style="padding:14px 16px;background:${SURFACE};
                                   border-bottom:2px solid ${BORDER};
                                   font-family:${FONT};font-size:12px;font-weight:700;
                                   color:${MUTED};text-transform:uppercase;letter-spacing:0.08em;">
              Feature
            </td>
            <td width="28%" style="padding:14px 16px;background:${BRAND_PRIMARY};
                                   border-bottom:2px solid ${BRAND_PRIMARY};text-align:center;
                                   font-family:${FONT};font-size:13px;font-weight:800;color:#ffffff;">
              {{company}} ✓
            </td>
            <td width="28%" style="padding:14px 16px;background:${SURFACE};
                                   border-bottom:2px solid ${BORDER};text-align:center;
                                   font-family:${FONT};font-size:13px;font-weight:800;color:${MUTED};">
              [Competitor]
            </td>
          </tr>

          <!-- Rows -->
          ${[
            ["Free migration", "✓", "✗"],
            ["Unlimited seats on Growth", "✓", "✗"],
            ["Native integrations (200+)", "✓", "Partial"],
            ["SOC 2 Type II", "✓", "In progress"],
            ["Dedicated CSM", "Growth+", "Enterprise only"],
            ["Response time SLA", "< 2 hrs", "< 24 hrs"],
            ["Annual pricing discount", "20%", "10%"],
            ["API access", "All plans", "Pro+ only"],
          ].map(([feat, us, them], i) => `
          <tr style="background:${i % 2 === 0 ? "#ffffff" : SURFACE};">
            <td style="padding:12px 16px;border-bottom:1px solid ${BORDER};
                       font-family:${FONT};font-size:13px;font-weight:600;color:${DARK};">
              ${feat}
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid ${BORDER};text-align:center;
                       font-family:${FONT};font-size:13px;font-weight:700;
                       color:${us === "✓" ? "#059669" : us === "✗" ? "#dc2626" : DARK};">
              ${us}
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid ${BORDER};text-align:center;
                       font-family:${FONT};font-size:13px;
                       color:${them === "✓" ? "#059669" : them === "✗" ? "#dc2626" : MUTED};">
              ${them}
            </td>
          </tr>`).join("")}
        </table>
      </td>
    </tr>

    <!-- Migration offer -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${BRAND_LIGHT};border-radius:10px;border:1px solid #bfdbfe;">
          <tr>
            <td style="padding:18px 20px;font-family:${FONT};font-size:14px;
                       line-height:1.65;color:#1e3a8a;">
              <strong style="color:${BRAND_PRIMARY};">Free migration, guaranteed.</strong>
              Switch from [Competitor] and we'll move all your data — history, automations,
              and settings — at no cost. Usually done within 2 business days.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:24px 40px 36px;">
        ${pillBtn("Start free — migrate later")}
        &nbsp;&nbsp;
        ${ghostBtn("Talk to sales")}
      </td>
    </tr>
    ${footer()}`)),
  },

  // ── R9. Agency pitch ────────────────────────────────────────────────────────
  {
    id: "ready-agency-pitch",
    kind: "ready",
    category: "Outreach",
    name: "Agency pitch",
    description: "Targeted outreach email for agency owners and their client management needs.",
    htmlContent: wrap(card(`
    <!-- Dark header with agency angle -->
    <tr>
      <td style="padding:28px 40px 20px;background:${DARK};border-radius:12px 12px 0 0;">
        <p style="margin:0 0 4px;font-family:${FONT};font-size:11px;font-weight:700;
                  color:#475569;text-transform:uppercase;letter-spacing:0.12em;">
          Built for agencies
        </p>
        <h1 style="margin:0;font-family:${FONT};font-size:24px;font-weight:800;
                   color:#ffffff;letter-spacing:-0.5px;">
          Run 30 client accounts without burning out your team
        </h1>
      </td>
    </tr>

    <!-- Opening -->
    <tr>
      <td style="padding:28px 40px 0;">
        <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.8;color:${MID};">
          Hi {{firstName}},
        </p>
        <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.8;color:${MID};">
          Agencies tell us the same story: too many client portals, too many Slack pings,
          and reporting that takes a full Friday afternoon every month.
          {{company}} was built to fix exactly that.
        </p>
      </td>
    </tr>

    <!-- Agency-specific pain → solution -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <!-- Pain column -->
            <td width="48%" valign="top" style="padding-right:8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background:#fff5f5;border-radius:10px;border:1px solid #fecaca;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;font-weight:700;
                              text-transform:uppercase;letter-spacing:0.08em;color:#dc2626;">
                      Current reality
                    </p>
                    <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.8;color:#7f1d1d;">
                      😩 &nbsp;Separate logins per client<br/>
                      😩 &nbsp;Manual monthly reports<br/>
                      😩 &nbsp;No visibility across accounts<br/>
                      😩 &nbsp;Onboarding each client from scratch
                    </p>
                  </td>
                </tr>
              </table>
            </td>
            <!-- Solution column -->
            <td width="48%" valign="top" style="padding-left:8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;font-weight:700;
                              text-transform:uppercase;letter-spacing:0.08em;color:#059669;">
                      With {{company}}
                    </p>
                    <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.8;color:#14532d;">
                      ✓ &nbsp;One dashboard, all clients<br/>
                      ✓ &nbsp;Auto-generated reports<br/>
                      ✓ &nbsp;Portfolio-level analytics<br/>
                      ✓ &nbsp;Cloneable client templates
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Agency-specific features -->
    <tr>
      <td style="padding:24px 40px 0;">
        ${eye("Built for agencies, specifically")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${featureRow("🏢", "White-label client portal", "Your brand, your domain. Clients never see our name.")}
          ${featureRow("📊", "One-click client reports", "PDF or live link, branded and ready to send in under 30 seconds.")}
          ${featureRow("💰", "Agency billing", "Charge clients directly through the platform. Automated invoicing included.")}
        </table>
      </td>
    </tr>

    <!-- Social proof -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:10px;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:18px 20px;font-family:${FONT};font-size:14px;
                       line-height:1.65;color:${MID};">
              <strong style="color:${DARK};">Agency benchmark:</strong>
              Teams using {{company}}'s agency plan report saving an average of
              <strong style="color:${BRAND_PRIMARY};">14 hours per week</strong> across
              client reporting, onboarding, and account switching.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:24px 40px 36px;">
        ${pillBtn("See the agency plan")}
        &nbsp;&nbsp;
        ${ghostBtn("Book a 20-min demo")}
        <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;">
          Agency plans include unlimited client accounts. Volume pricing available.
        </p>
      </td>
    </tr>
    ${footer()}`)),
  },

  // ── R10. Year in review ─────────────────────────────────────────────────────
  {
    id: "ready-year-review",
    kind: "ready",
    category: "Newsletter",
    name: "Year in review",
    description: "Annual recap email — customer milestones, top features, and what's coming.",
    htmlContent: wrap(card(`
    <!-- Hero year banner -->
    <tr>
      <td style="background:${DARK};padding:36px 40px;text-align:center;
                 border-radius:12px 12px 0 0;">
        <p style="margin:0 0 8px;font-family:${FONT};font-size:60px;font-weight:900;
                  color:${BRAND_PRIMARY};letter-spacing:-2px;line-height:1;">{{year}}</p>
        <p style="margin:0;font-family:${FONT};font-size:16px;font-weight:600;
                  color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">
          wrapped up
        </p>
      </td>
    </tr>

    <!-- Intro -->
    <tr>
      <td style="padding:32px 40px 0;">
        <h1 style="margin:0;font-family:${FONT};font-size:24px;font-weight:800;
                   color:${DARK};letter-spacing:-0.5px;">
          What a year, {{firstName}}
        </h1>
        <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.8;color:${MID};">
          You've been with us for [X months]. Here's everything your team accomplished —
          and a look at what we're building for you next year.
        </p>
      </td>
    </tr>

    <!-- Your year in numbers -->
    <tr>
      <td style="padding:24px 40px 0;">
        ${eye("Your {{year}} in numbers")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:12px;border:1px solid ${BORDER};">
          <tr>
            ${stat("{{tasksCompleted}}", "Tasks done")}
            <td width="1" style="background:${BORDER};font-size:0;">&nbsp;</td>
            ${stat("{{hoursaved}}h", "Hours saved")}
            <td width="1" style="background:${BORDER};font-size:0;">&nbsp;</td>
            ${stat("{{automationsRun}}", "Automations")}
          </tr>
        </table>
      </td>
    </tr>

    <!-- Top moments timeline -->
    <tr>
      <td style="padding:24px 40px 0;">
        ${eye("Highlights from the year")}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="20" valign="top" align="center">
              <div style="width:2px;background:${BRAND_PRIMARY};margin:0 auto;height:100%;font-size:0;">
                &nbsp;
              </div>
            </td>
            <td style="padding:0 0 20px 16px;">
              <p style="margin:0 0 2px;font-family:${FONT};font-size:11px;font-weight:700;
                        color:${BRAND_PRIMARY};text-transform:uppercase;letter-spacing:0.08em;">
                Q1 · January
              </p>
              <p style="margin:0;font-family:${FONT};font-size:14px;font-weight:700;color:${DARK};">
                First workflow published
              </p>
              <p style="margin:2px 0 0;font-family:${FONT};font-size:13px;color:${MUTED};">
                Your team automated [X] for the first time.
              </p>
            </td>
          </tr>
          <tr>
            <td width="20" valign="top" align="center">
              <div style="width:2px;background:${BORDER};margin:0 auto;height:100%;font-size:0;">
                &nbsp;
              </div>
            </td>
            <td style="padding:0 0 20px 16px;">
              <p style="margin:0 0 2px;font-family:${FONT};font-size:11px;font-weight:700;
                        color:${MUTED};text-transform:uppercase;letter-spacing:0.08em;">
                Q2 · April
              </p>
              <p style="margin:0;font-family:${FONT};font-size:14px;font-weight:700;color:${DARK};">
                Team expanded to {{teamSize}} members
              </p>
              <p style="margin:2px 0 0;font-family:${FONT};font-size:13px;color:${MUTED};">
                Collaboration went up 3× after the team joined.
              </p>
            </td>
          </tr>
          <tr>
            <td width="20" valign="top" align="center">
              <div style="width:2px;background:${BORDER};margin:0 auto;height:100%;font-size:0;">
                &nbsp;
              </div>
            </td>
            <td style="padding:0 0 0 16px;">
              <p style="margin:0 0 2px;font-family:${FONT};font-size:11px;font-weight:700;
                        color:${MUTED};text-transform:uppercase;letter-spacing:0.08em;">
                Q4 · November
              </p>
              <p style="margin:0;font-family:${FONT};font-size:14px;font-weight:700;color:${DARK};">
                Best month on record
              </p>
              <p style="margin:2px 0 0;font-family:${FONT};font-size:13px;color:${MUTED};">
                {{bestMonthStat}} — your highest output yet.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- What's coming -->
    <tr>
      <td style="padding:24px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${DARK};border-radius:10px;">
          <tr>
            <td style="padding:22px 24px;">
              ${eye("What's coming in {{nextYear}}", "#475569")}
              <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.8;color:#cbd5e1;">
                🚀 &nbsp;[Big feature 1] — shipping Q1<br/>
                🤝 &nbsp;[Partnership or integration] — launching Q2<br/>
                📱 &nbsp;[Mobile / platform expansion] — H2
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Thank you + CTA -->
    <tr>
      <td align="center" style="padding:28px 40px 36px;">
        <p style="margin:0 0 20px;font-family:${FONT};font-size:16px;line-height:1.65;
                  color:${MID};">
          Thank you for being part of {{company}}.
          We're building {{nextYear}} with you in mind.
        </p>
        ${pillBtn("See what's coming →")}
      </td>
    </tr>
    ${footer()}`)),
  },

  // ── R11. NPS / feedback survey ──────────────────────────────────────────────
  {
    id: "ready-nps-survey",
    kind: "ready",
    category: "Newsletter",
    name: "NPS / feedback",
    description: "Short, high-converting NPS or satisfaction survey email.",
    htmlContent: wrap(card(`
    <!-- Header -->
    <tr>
      <td align="center" style="padding:36px 40px 0;">
        <p style="margin:0 0 12px;font-size:36px;">💬</p>
        ${eye("Quick question")}
        <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:800;
                   color:${DARK};letter-spacing:-0.5px;">
          How likely are you to recommend us?
        </h1>
        <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;
                  line-height:1.75;color:${MID};">
          Hi {{firstName}}, it takes 30 seconds and directly shapes what we build next.
        </p>
      </td>
    </tr>

    <!-- NPS score buttons -->
    <tr>
      <td style="padding:28px 40px 0;">
        <p style="margin:0 0 12px;font-family:${FONT};font-size:12px;font-weight:700;
                  color:${MUTED};text-transform:uppercase;letter-spacing:0.08em;
                  text-align:center;">
          0 = Not at all likely &nbsp;&nbsp; 10 = Extremely likely
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            ${[0,1,2,3,4,5,6,7,8,9,10].map(n => `
            <td align="center" style="padding:2px;">
              <a href="#score-${n}"
                style="display:inline-block;width:40px;height:40px;border-radius:8px;
                       background:${n >= 9 ? BRAND_PRIMARY : n >= 7 ? BRAND_LIGHT : SURFACE};
                       border:1px solid ${n >= 9 ? BRAND_PRIMARY : BORDER};
                       font-family:${FONT};font-size:14px;font-weight:700;
                       color:${n >= 9 ? "#ffffff" : n >= 7 ? BRAND_PRIMARY : MUTED};
                       text-decoration:none;text-align:center;line-height:40px;">
                ${n}
              </a>
            </td>`).join("")}
          </tr>
        </table>
      </td>
    </tr>

    <!-- Open text nudge -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:10px;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:16px 20px;font-family:${FONT};font-size:14px;
                       line-height:1.65;color:${MID};">
              Prefer to type a quick note? Reply directly to this email —
              <a href="mailto:feedback@{{company}}.com"
                style="color:${BRAND_PRIMARY};font-weight:700;text-decoration:none;">
                feedback@{{company}}.com
              </a>
              — our founders read every response.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Incentive -->
    <tr>
      <td style="padding:16px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${BRAND_LIGHT};border-radius:10px;border:1px solid #bfdbfe;">
          <tr>
            <td style="padding:14px 20px;font-family:${FONT};font-size:14px;
                       line-height:1.65;color:#1e3a8a;">
              🎁 &nbsp; Complete the survey and we'll add
              <strong>1 extra month free</strong> to your account as a thank-you.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Sign-off -->
    <tr>
      <td style="padding:24px 40px 36px;">
        <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.8;color:${MID};">
          Thank you for helping us build something better.<br/><br/>
          — {{founderName}}, CEO at {{company}}
        </p>
      </td>
    </tr>
    ${footer()}`)),
  },

  // ── R12. Power feature upsell ────────────────────────────────────────────────
  {
    id: "ready-upsell-power",
    kind: "ready",
    category: "Subscription",
    name: "Power feature upsell",
    description: "Targeted email to unlock a specific premium feature — ROI-led upgrade nudge.",
    htmlContent: wrap(card(`
    <!-- Locked feature banner -->
    <tr>
      <td style="background:#fefce8;padding:14px 32px;text-align:center;
                 border-top:3px solid #f59e0b;">
        <p style="margin:0;font-family:${FONT};font-size:13px;font-weight:700;
                  color:#92400e;letter-spacing:0.04em;">
          🔒 &nbsp; [Feature Name] is available on Growth and above
        </p>
      </td>
    </tr>

    <!-- Header -->
    <tr>
      <td style="padding:32px 40px 0;">
        ${eye("Unlock [Feature Name]")}
        <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:800;
                   color:${DARK};letter-spacing:-0.5px;">
          {{firstName}}, you're one upgrade away from [specific outcome]
        </h1>
        <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.8;color:${MID};">
          Based on how your team uses {{company}}, [Feature Name] would save you
          approximately <strong style="color:${DARK};">{{estimatedTimeSaved}} hours per month</strong>.
          Here's what you're currently missing.
        </p>
      </td>
    </tr>

    <!-- Feature preview -->
    <tr>
      <td style="padding:24px 40px 0;">
        <div style="background:#f1f5f9;border-radius:12px;height:180px;border:1px solid ${BORDER};
                    text-align:center;line-height:180px;position:relative;">
          <span style="font-family:${FONT};font-size:12px;color:#94a3b8;
                       text-transform:uppercase;letter-spacing:0.08em;">
            Feature preview / screenshot
          </span>
        </div>
      </td>
    </tr>

    <!-- ROI breakdown -->
    <tr>
      <td style="padding:20px 40px 0;">
        ${eye("Your estimated ROI")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${DARK};border-radius:12px;">
          <tr>
            ${stat("{{estimatedTimeSaved}}h", "Saved / month")}
            <td width="1" style="background:#1e293b;font-size:0;">&nbsp;</td>
            ${stat("{{estimatedMoneySaved}}", "Value / year")}
            <td width="1" style="background:#1e293b;font-size:0;">&nbsp;</td>
            ${stat("{{upgradeROI}}×", "Return on upgrade")}
          </tr>
        </table>
      </td>
    </tr>

    <!-- What you get -->
    <tr>
      <td style="padding:20px 40px 0;">
        ${eye("What's included on Growth")}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${featureRow("🎯", "Unlocked: [Feature Name]", "Full access with no usage caps — use it as much as you need.")}
          ${featureRow("⚡", "Priority support queue", "Skip the line. Average first response under 30 minutes.")}
          ${featureRow("📊", "Advanced analytics suite", "Deeper reporting, custom dashboards, and CSV exports.")}
          ${featureRow("🔗", "API + webhooks", "Connect to anything. Build custom automations with your stack.")}
        </table>
      </td>
    </tr>

    <!-- Pricing snapshot -->
    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background:${SURFACE};border-radius:10px;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:18px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family:${FONT};font-size:14px;color:${MID};">
                    Your current plan ({{currentPlan}})
                  </td>
                  <td align="right" style="font-family:${FONT};font-size:14px;
                                           font-weight:700;color:${DARK};">
                    {{currentPrice}}/mo
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:8px;font-family:${FONT};font-size:14px;
                             font-weight:700;color:${DARK};">
                    Growth plan
                  </td>
                  <td align="right" style="padding-top:8px;font-family:${FONT};
                                           font-size:14px;font-weight:700;color:${BRAND_PRIMARY};">
                    {{growthPrice}}/mo
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:12px;border-top:1px solid ${BORDER};">
                    <p style="margin:0;font-family:${FONT};font-size:12px;color:${MUTED};">
                      Billed monthly · Cancel any time · Prorated upgrade
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:24px 40px 36px;">
        ${pillBtn("Upgrade to Growth")}
        &nbsp;&nbsp;
        ${ghostBtn("See all plan details")}
        <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;">
          Upgrade instantly. Your data and settings stay exactly as they are.
        </p>
      </td>
    </tr>
    ${footer()}`)),
  },
  // ── 1. Product highlights ───────────────────────────────────────────────────
  {
    id: "ready-product-1",
    kind: "ready",
    category: "Product",
    name: "Product highlights",
    description: "Hero image, benefit bullets, and CTA.",
    htmlContent: wrap(
      card(`
      <!-- Hero image -->
      <tr>
        <td style="padding:0;font-size:0;line-height:0;">
          <img src="https://images.unsplash.com/red-and-white-labeled-box-3jcYvGkfXUg?w=1200&q=80"
            alt="Product hero" width="600"
            style="display:block;width:100%;max-height:240px;object-fit:cover;
                   border-radius:12px 12px 0 0;" />
        </td>
      </tr>
      <!-- Badge + headline -->
      <tr>
        <td style="padding:28px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:${BRAND_PRIMARY};border-radius:999px;
                         padding:4px 12px;margin-bottom:14px;">
                <span style="font-family:${FONT};font-size:11px;font-weight:700;
                             color:#ffffff;letter-spacing:0.08em;text-transform:uppercase;">
                  New release
                </span>
              </td>
            </tr>
          </table>
          <h1 style="margin:12px 0 0;font-family:${FONT};font-size:26px;font-weight:800;
                     line-height:1.2;color:#0f172a;letter-spacing:-0.5px;">
            Bring your product story to life
          </h1>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;
                    line-height:1.75;color:#475569;">
            Hi {{firstName}}, highlight benefits in plain language,
            then invite readers to take the next step.
          </p>
        </td>
      </tr>
      <!-- Benefit bullets -->
      <tr>
        <td style="padding:20px 40px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
            style="background:#f8fafc;border-radius:10px;">
            <tr>
              <td style="padding:18px 20px;font-family:${FONT};font-size:14px;
                         line-height:1.8;color:#374151;">
                ✅ &nbsp;<strong style="color:#0f172a;">Clear outcome</strong> — what the customer gains<br/>
                ✅ &nbsp;<strong style="color:#0f172a;">Social proof</strong> — a reassurance signal<br/>
                ✅ &nbsp;<strong style="color:#0f172a;">Simple next step</strong> — remove all friction
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:24px 40px 36px;">
          ${pillBtn("Shop the collection")}
        </td>
      </tr>
      ${footer()}`)
    ),
  },

];

// ─── Category constants ───────────────────────────────────────────────────────

export const READY_TO_USE_CATEGORIES = [
  "All",
  "Product",
  "Newsletter",
  "Subscription",
  "Announcement",
  "Promo",
  "Outreach",
] as const;

export type ReadyToUseCategory =
  (typeof READY_TO_USE_CATEGORIES)[number];