import nodemailer from "nodemailer";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";

/**
 * SMTP credentials for the support@mnxrides.co.za mailbox. Held as secrets
 * rather than config so they never land in source or in a deploy log.
 *
 * Set them once with:
 *   firebase functions:secrets:set SMTP_HOST
 *   firebase functions:secrets:set SMTP_PORT
 *   firebase functions:secrets:set SMTP_USER
 *   firebase functions:secrets:set SMTP_PASSWORD
 */
export const SMTP_HOST = defineSecret("SMTP_HOST");
export const SMTP_PORT = defineSecret("SMTP_PORT");
export const SMTP_USER = defineSecret("SMTP_USER");
export const SMTP_PASSWORD = defineSecret("SMTP_PASSWORD");

/** Every secret an email-sending function needs, so callers can spread one list. */
export const EMAIL_SECRETS = [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD];

/**
 * Where the deployed app lives. Used to build links back into it, so a move
 * off the current host is a config change rather than a code change.
 */
export const APP_URL = defineString("APP_URL", {
  default: "https://mnxrides.co.za/smartreminder/",
});

const FROM_NAME = "Smart R";
const FROM_ADDRESS = "support@mnxrides.co.za";

const appUrl = () => APP_URL.value().replace(/\/+$/, "");

let cachedTransport: nodemailer.Transporter | null = null;

const transport = () => {
  if (cachedTransport) return cachedTransport;

  const port = Number(SMTP_PORT.value() || 465);
  cachedTransport = nodemailer.createTransport({
    host: SMTP_HOST.value(),
    port,
    // 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: port === 465,
    auth: { user: SMTP_USER.value(), pass: SMTP_PASSWORD.value() },
  });
  return cachedTransport;
};

export interface CalendarEvent {
  title: string;
  description: string;
  /** 'YYYY-MM-DD' */
  date: string;
  /** 'HH:mm', or null for an all-day entry. */
  time: string | null;
  location?: string | null;
}

const pad = (n: number) => String(n).padStart(2, "0");

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
};

const addHour = (date: string, time: string) => {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCHours(h + 1, m);
  return {
    stamp: `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`,
  };
};

/**
 * Google Calendar prefill link. Times are deliberately sent as floating local
 * values with an explicit ctz, so the entry lands at the time written on the
 * reminder rather than being shifted by whatever timezone the server ran in.
 */
export const googleCalendarUrl = (event: CalendarEvent): string => {
  const compactDate = event.date.replace(/-/g, "");
  const dates = event.time
    ? `${compactDate}T${event.time.replace(":", "")}00/${addHour(event.date, event.time).stamp}`
    : `${compactDate}/${addDays(event.date, 1)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
    details: event.description || "",
    ctz: "Africa/Johannesburg",
  });
  if (event.location) params.set("location", event.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const icsEscape = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/**
 * .ics attachment for calendar apps that don't take a Google link — Apple
 * Mail and Outlook desktop in particular. Times are floating (no TZID, no Z)
 * so clients read them as local, matching what the reminder says.
 */
export const buildIcs = (event: CalendarEvent, uid: string): string => {
  const compactDate = event.date.replace(/-/g, "");
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const start = event.time
    ? `DTSTART:${compactDate}T${event.time.replace(":", "")}00`
    : `DTSTART;VALUE=DATE:${compactDate}`;
  const end = event.time
    ? `DTEND:${addHour(event.date, event.time).stamp}`
    : `DTEND;VALUE=DATE:${addDays(event.date, 1)}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Smart R//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // Domain-ish token, not the display name: a space here is asking for
    // trouble in a field calendar clients use to dedupe events.
    `UID:${uid}@smart-r`,
    `DTSTAMP:${stamp}`,
    start,
    end,
    `SUMMARY:${icsEscape(event.title)}`,
    event.description ? `DESCRIPTION:${icsEscape(event.description)}` : "",
    event.location ? `LOCATION:${icsEscape(event.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

interface Layout {
  heading: string;
  intro: string;
  bodyRows: Array<[string, string]>;
  primaryLabel: string;
  primaryHref: string;
  secondaryNote?: string;
}

/** Table-based layout — the only thing mail clients render consistently. */
const renderHtml = ({
  heading,
  intro,
  bodyRows,
  primaryLabel,
  primaryHref,
  secondaryNote,
}: Layout) => `
<div style="background:#f4f4f5;padding:24px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:20px 24px;">
        <span style="color:#ffffff;font-size:18px;font-weight:700;">Smart R</span>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <h1 style="margin:0 0 8px;font-size:20px;color:#18181b;">${escapeHtml(heading)}</h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525b;">${escapeHtml(intro)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;">
          ${bodyRows
            .map(
              ([label, value]) => `
          <tr>
            <td style="padding:10px 14px;font-size:12px;color:#71717a;width:120px;border-bottom:1px solid #f4f4f5;">${escapeHtml(label)}</td>
            <td style="padding:10px 14px;font-size:14px;color:#18181b;font-weight:600;border-bottom:1px solid #f4f4f5;">${escapeHtml(value)}</td>
          </tr>`
            )
            .join("")}
        </table>
        <p style="margin:24px 0 0;">
          <a href="${primaryHref}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;">${escapeHtml(primaryLabel)}</a>
        </p>
        ${
          secondaryNote
            ? `<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#71717a;">${secondaryNote}</p>`
            : ""
        }
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;background:#fafafa;font-size:11px;color:#a1a1aa;">
        Sent by Smart R. If this wasn't meant for you, you can ignore it.
      </td>
    </tr>
  </table>
</div>`;

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  icsAttachment?: { filename: string; content: string };
}

const send = async ({ to, subject, html, text, icsAttachment }: SendArgs) => {
  if (!SMTP_HOST.value()) {
    logger.warn("SMTP is not configured; skipping email", { to, subject });
    return false;
  }

  try {
    await transport().sendMail({
      from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
      to,
      subject,
      text,
      html,
      attachments: icsAttachment
        ? [
            {
              filename: icsAttachment.filename,
              content: icsAttachment.content,
              contentType: "text/calendar; method=PUBLISH; charset=UTF-8",
            },
          ]
        : undefined,
    });
    logger.info("Email sent", { to, subject });
    return true;
  } catch (error) {
    // Never let a mail failure roll back the Firestore write that triggered it.
    logger.error("Email failed", { to, subject, error });
    return false;
  }
};

export interface ReminderEmailArgs {
  to: string;
  /** How the recipient is addressed. */
  recipientName?: string | null;
  /** Set when the recipient was assigned by someone else. */
  assignedBy?: string | null;
  reminderId: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string | null;
  priority: string;
  category: string;
  location?: string | null;
}

export const sendReminderEmail = async (args: ReminderEmailArgs) => {
  const when = args.dueTime ? `${args.dueDate} at ${args.dueTime}` : `${args.dueDate} (all day)`;

  const event: CalendarEvent = {
    title: args.title,
    description: args.description,
    date: args.dueDate,
    time: args.dueTime,
    location: args.location,
  };

  const calendarLink = googleCalendarUrl(event);

  const heading = args.assignedBy ? "A reminder was assigned to you" : "Your reminder is set";
  const intro = args.assignedBy
    ? `${args.assignedBy} assigned you this reminder on Smart R.`
    : "This reminder has been added to your Smart R account.";

  const rows: Array<[string, string]> = [
    ["Reminder", args.title],
    ["Due", when],
    ["Priority", args.priority],
    ["Category", args.category],
  ];
  if (args.description) rows.splice(1, 0, ["Details", args.description]);
  if (args.location) rows.push(["Location", args.location]);

  const html = renderHtml({
    heading,
    intro,
    bodyRows: rows,
    primaryLabel: "Add to calendar",
    primaryHref: calendarLink,
    secondaryNote: `Prefer another calendar? Open the attached invite file. You can also <a href="${appUrl()}/" style="color:#6366f1;">view this in Smart R</a>.`,
  });

  const text = [
    heading,
    "",
    intro,
    "",
    `Reminder: ${args.title}`,
    args.description ? `Details: ${args.description}` : "",
    `Due: ${when}`,
    `Priority: ${args.priority}`,
    `Category: ${args.category}`,
    args.location ? `Location: ${args.location}` : "",
    "",
    `Add to calendar: ${calendarLink}`,
    `Open Smart R: ${appUrl()}/`,
  ]
    .filter(Boolean)
    .join("\n");

  return send({
    to: args.to,
    subject: args.assignedBy
      ? `${args.assignedBy} assigned you: ${args.title}`
      : `Reminder set: ${args.title}`,
    html,
    text,
    icsAttachment: {
      filename: "reminder.ics",
      content: buildIcs(event, args.reminderId),
    },
  });
};

export interface InviteEmailArgs {
  to: string;
  inviteeName: string;
  inviterName: string;
  token: string;
}

export const sendFamilyInviteEmail = async (args: InviteEmailArgs) => {
  const link = `${appUrl()}/invite?token=${encodeURIComponent(args.token)}`;

  const html = renderHtml({
    heading: `${args.inviterName} wants to link with you`,
    intro: `You've been invited to join ${args.inviterName}'s family on Smart R. Once you accept, you can share reminders and loyalty cards with each other.`,
    bodyRows: [
      ["Invited by", args.inviterName],
      ["Invited as", args.inviteeName],
    ],
    primaryLabel: "Accept invitation",
    primaryHref: link,
    secondaryNote: `If the button doesn't work, paste this into your browser:<br><span style="word-break:break-all;color:#52525b;">${link}</span><br><br>This invitation expires in 14 days.`,
  });

  const text = [
    `${args.inviterName} wants to link with you on Smart R.`,
    "",
    `Once you accept, you can share reminders and loyalty cards with each other.`,
    "",
    `Accept the invitation: ${link}`,
    "",
    "This invitation expires in 14 days.",
  ].join("\n");

  return send({
    to: args.to,
    subject: `${args.inviterName} invited you to Smart R`,
    html,
    text,
  });
};
