import { addDays } from "./date";

// iCalendar (.ics) fayli: Google Calendar, iPhone va Outlook taniydi.
// events: [{ date: Date, taskKey: "duty", title: "⭐ Navbatchilik", reminder: "..." }]

const pad = (value) => String(value).padStart(2, "0");

// 20261102 - butun kunlik tadbir sanasi
const formatIcsDate = (date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;

// 20261102T091500Z - UTC vaqt
const formatIcsTimestamp = (date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
  `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

// Matndagi maxsus belgilar ekranlanadi
const escapeText = (text) =>
  text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export const buildIcs = ({ calendarName, events, userId }) => {
  const stamp = formatIcsTimestamp(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Control Your Flat//Duties//UZ",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];

  events.forEach(({ date, taskKey, title, reminder }) => {
    const day = formatIcsDate(date);

    lines.push(
      "BEGIN:VEVENT",
      // Bir xil UID: faylni qayta import qilsangiz, tadbirlar takrorlanmaydi
      `UID:${day}-${taskKey}-${userId}@control-your-flat`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `DTEND;VALUE=DATE:${formatIcsDate(addDays(date, 1))}`,
      `SUMMARY:${escapeText(title)}`,
      "TRANSP:TRANSPARENT",
      // Eslatma: navbatdan oldingi kun kechqurun soat 21:00 da
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(reminder)}`,
      "TRIGGER:-PT3H",
      "END:VALARM",
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");

  // Standart bo'yicha qatorlar CRLF bilan ajratiladi
  return lines.join("\r\n");
};

export const downloadFile = (content, fileName, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};
