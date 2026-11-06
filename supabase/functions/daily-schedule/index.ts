// Uylar navbatlari: har bir uyning Telegram guruhiga kunlik xabar (Supabase Edge Function).
//
// Ertalab (sukut bo'yicha): bugungi navbatchilar @nickname bilan belgilanadi, ertangi navbatlar
// qisqacha, ob-havo, yomg'ir haqida ogohlantirish va kun maslahati.
// Kechqurun (body: {"mode":"evening"} yoki ?mode=evening): faqat ertangi navbatchilarga eslatma.
//
// Xabar flats.telegram_chat_id ulangan har bir uyga yuboriladi. Eng birinchi yaratilgan uyda
// telegram_chat_id bo'sh bo'lsa, TELEGRAM_CHAT_ID secret ishlatiladi (eski sozlama ishlayveradi).
//
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY
// (oxirgi ikkisini Supabase o'zi beradi). Uylar ma'lumoti yopiq (RLS), shuning uchun bot
// service role kaliti bilan o'qiydi. Bu kalit faqat serverda turadi, saytga chiqmaydi.
// Ixtiyoriy: SITE_URL (masalan https://control-your-flat.vercel.app) - "Jadvalni ochish" tugmasi.

type User = { user_id: string; name: string; last_name: string | null; nickname: string | null };
type Person = { user_id: string; name: string; last_name: string | null };
type BuiltinTask = "duty" | "rubbish" | "cleaning";
// Kun: har bir vazifa kaliti bo'yicha odamlar (o'rnatilganlar va uyning o'z vazifalari)
type Schedule = Record<string, Person[]>;
// Xabardagi bitta vazifa qatori
type TaskLine = { key: string; icon: string; label: string; none: string; join: string };
type WeatherDay = { icon: string; label: string; min: number; max: number; rain: number; wet: boolean };
type Weather = { today: WeatherDay; tomorrow: WeatherDay };
type Flat = {
  id: string;
  name: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  telegram_chat_id: string | null;
};
type FlatTask = {
  task: string;
  enabled: boolean;
  every_days: number;
  is_custom: boolean;
  name: string | null;
  icon: string | null;
  position: number;
};

const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

// Saytdagi "Kun maslahati" bilan bir xil ro'yxat va tartib
const TIPS = [
  "Idishlarni o'sha kuni yuving, ertaga ular ikki barobar ko'p bo'ladi!",
  "Oshxonadan chiqishdan oldin stolni artib qo'ying.",
  "Musor paketi to'lsa, navbatni kutmasdan tashlab yuboring!",
  "Kechqurun shovqinni kamaytiring, kimdir dam olayotgan bo'lishi mumkin.",
  "Muzlatgichdagi eski ovqatlarni bir kunda bir marta tekshiring.",
  "Boshqalarning narsasini so'ramasdan olmang!",
  "Hammom va hojatxonani o'zingizdan keyin toza qoldiring!",
  "Chiroq va suvni behuda yoqib qoldirmang!",
  "Navbatni almashtirmoqchi bo'lsangiz, oldindan kelishib oling.",
  "Yuvilgan kiyimlarni quritgichda uzoq qoldirmang.",
];

// Vazifalar: belgisi, nomi, bugun ham keyin ham bo'lmasa nima yoziladi va ismlar orasidagi so'z
const TASK_LINES: Record<BuiltinTask, TaskLine> = {
  duty: { key: "duty", icon: "⭐", label: "Navbatchi", none: "—", join: ", " },
  rubbish: { key: "rubbish", icon: "🗑", label: "Musor", none: "bugun yo'q", join: ", " },
  cleaning: { key: "cleaning", icon: "🧹", label: "Uborka", none: "yaqin kunlarda yo'q", join: " va " },
};

const TASK_ORDER: BuiltinTask[] = ["duty", "rubbish", "cleaning"];

// Uyning o'z vazifalari belgilari (saytdagi ikonkalar bilan mos)
const CUSTOM_EMOJI: Record<string, string> = {
  star: "⭐",
  bin: "🗑",
  sparkles: "✨",
  dishes: "🍽",
  plant: "🪴",
  laundry: "🧺",
  cart: "🛒",
  bath: "🛁",
  pet: "🐾",
  cook: "🍳",
  broom: "🧹",
  window: "🪟",
  water: "💧",
};

// Yoqilgan vazifalar xabar tartibida: avval o'rnatilganlar, keyin o'z vazifalari
const toTaskLines = (flatTasks: FlatTask[]): TaskLine[] => {
  const enabled = flatTasks.filter((item) => item.enabled);

  // Nomi yoki belgisi o'zgartirilgan bo'lsa - shu, aks holda asl holi
  const builtin = TASK_ORDER.map((key) => [key, enabled.find((item) => item.task === key)] as const)
    .filter(([, item]) => item)
    .map(([key, item]) => ({
      ...TASK_LINES[key],
      label: item?.name ? escapeHtml(item.name) : TASK_LINES[key].label,
      icon: item?.icon ? (CUSTOM_EMOJI[item.icon] ?? TASK_LINES[key].icon) : TASK_LINES[key].icon,
    }));

  const custom = enabled
    .filter((item) => item.is_custom)
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      key: item.task,
      icon: CUSTOM_EMOJI[item.icon ?? ""] ?? "✅",
      label: escapeHtml(item.name ?? ""),
      none: "—",
      join: ", ",
    }));

  return [...builtin, ...custom];
};

// Supabase serverlari soatidagi kichik farq tufayli ba'zan "JWT issued at future" (PGRST303)
// qaytadi. Bu vaqtinchalik: biroz kutib, qayta uriniladi
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// SANALAR ("2026-11-02" ko'rinishida, uyning vaqt mintaqasi bo'yicha)

export const getLocalDate = (timeZone = "Asia/Tashkent", date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const toUtcDate = (dateString: string) => new Date(`${dateString}T00:00:00Z`);

export const addDays = (dateString: string, days: number) => {
  const date = toUtcDate(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

// "Dushanba, 2-noyabr"
export const formatUzDate = (dateString: string) => {
  const date = toUtcDate(dateString);
  return `${WEEKDAYS[date.getUTCDay()]}, ${date.getUTCDate()}-${MONTHS[date.getUTCMonth()]}`;
};

const getDayOfYear = (dateString: string) => {
  const date = toUtcDate(dateString);
  return Math.round((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86_400_000);
};

// MATN

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fullName = (person: Person) =>
  escapeHtml(`${person.name.trim()} ${person.last_name?.trim() ?? ""}`.trim());

// Bazadagi nickname'lar bo'yicha @belgilash: Telegram belgilangan odamga bildirishnoma yuboradi
const createMention = (users: User[]) => {
  const nicknames = new Map(users.map((user) => [user.user_id, user.nickname?.trim() ?? ""]));

  const toHandle = (person: Person) => {
    const nickname = nicknames.get(person.user_id);
    if (!nickname) return null;
    return escapeHtml(nickname.startsWith("@") ? nickname : `@${nickname}`);
  };

  return {
    // "Farohiddin Ortiqov (@Faroxiddin7396)"
    withName: (person: Person) => {
      const handle = toHandle(person);
      return handle ? `${fullName(person)} (${handle})` : fullName(person);
    },
    // "@Faroxiddin7396" (nickname bo'lmasa, ism)
    only: (person: Person) => toHandle(person) ?? fullName(person),
  };
};

// OB-HAVO (Open-Meteo, bepul va kalitsiz)

const RAIN_CODES = (code: number) =>
  (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;

const describeWeather = (code: number): [string, string] => {
  if (code === 0) return ["☀️", "Ochiq osmon"];
  if (code <= 2) return ["🌤", "Qisman bulutli"];
  if (code === 3) return ["☁️", "Bulutli"];
  if (code === 45 || code === 48) return ["🌫", "Tuman"];
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ["❄️", "Qor"];
  if (code >= 95) return ["⛈", "Momaqaldiroq"];
  if (RAIN_CODES(code)) return ["🌧", "Yomg'ir"];
  return ["🌡", "Ob-havo"];
};

// Uy manzili (koordinatalari) kiritilmagan bo'lsa, ob-havo qismi chiqmaydi
export const fetchWeather = async (flat: Flat): Promise<Weather | null> => {
  if (flat.latitude == null || flat.longitude == null) return null;

  const params = new URLSearchParams({
    latitude: String(flat.latitude),
    longitude: String(flat.longitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "2",
    timezone: flat.timezone,
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

  if (!response.ok) throw new Error(`Weather error: ${response.status}`);

  const { daily } = await response.json();

  const getDay = (index: number): WeatherDay => {
    const code = daily.weather_code[index];
    const rain = daily.precipitation_probability_max[index] ?? 0;
    const [icon, label] = describeWeather(code);

    return {
      icon,
      label,
      min: Math.round(daily.temperature_2m_min[index]),
      max: Math.round(daily.temperature_2m_max[index]),
      rain,
      wet: RAIN_CODES(code) || rain >= 50,
    };
  };

  return { today: getDay(0), tomorrow: getDay(1) };
};

const formatWeatherLine = (day: WeatherDay) =>
  `${day.icon} ${day.label}, ${day.min}°…${day.max}° · ☔ ${day.rain}%`;

// XABARLAR

// Ertalabki xabar. schedules[0] - bugun, schedules[1] - ertaga, keyingilari siyrak vazifalarni
// (masalan, uborka) qidirish uchun. tasks - uyda yoqilgan vazifalar
export const buildMorningMessage = ({
  flatName,
  today,
  schedules,
  tasks,
  users,
  weather,
}: {
  flatName: string;
  today: string;
  schedules: Schedule[];
  tasks: TaskLine[];
  users: User[];
  weather: Weather | null;
}) => {
  const mention = createMention(users);
  const [todaySchedule, tomorrowSchedule] = schedules;
  const lines: string[] = [];

  lines.push(`🏠 <b>${escapeHtml(flatName)}: navbatlar</b>`);
  lines.push(`📅 <b>${formatUzDate(today)}</b>`);
  if (weather) lines.push(formatWeatherLine(weather.today));
  lines.push("");

  // Bugungi navbatchilar belgilanadi. Vazifa bugun bo'lmasa, keyingisi qachonligi
  for (const line of tasks) {
    const task = line.key;
    const people = todaySchedule[task] ?? [];
    let value: string;

    if (people.length) {
      value = people.map(mention.withName).join(line.join);
    } else {
      const nextIndex = schedules.findIndex((schedule) => (schedule[task] ?? []).length > 0);

      if (nextIndex === -1) {
        value = line.none;
      } else {
        const when = nextIndex === 1 ? "ertaga" : `${nextIndex} kundan keyin`;
        const names = schedules[nextIndex][task]
          .map((person) => escapeHtml(person.name.trim()))
          .join(line.join);
        value = `${when} (${names})`;
      }
    }

    lines.push(`${line.icon} <b>${line.label}:</b> ${value}`);
  }

  // Ertangi navbatlar qisqacha, iqtibos ichida (belgilanmaydi: kechki eslatmada belgilanadi)
  const tomorrowLines = [`🔜 <b>Ertaga</b> · ${formatUzDate(addDays(today, 1))}`];

  for (const line of tasks) {
    const people = tomorrowSchedule[line.key] ?? [];

    if (people.length) {
      tomorrowLines.push(`${line.icon} ${people.map(fullName).join(line.join)}`);
    }
  }

  lines.push("");
  lines.push(`<blockquote>${tomorrowLines.join("\n")}</blockquote>`);

  // Ob-havoni musor navbati bilan bog'laydigan ogohlantirishlar
  const warnings: string[] = [];
  const rubbishToday = todaySchedule.rubbish[0];
  const rubbishTomorrow = tomorrowSchedule.rubbish[0];

  if (weather?.today.wet && rubbishToday) {
    warnings.push(
      `☔ Bugun yomg'ir ehtimoli bor. ${escapeHtml(rubbishToday.name.trim())}, musorga soyabon bilan chiqing.`
    );
  }

  if (weather?.tomorrow.wet && rubbishTomorrow) {
    warnings.push(
      `🌧 Ertaga yomg'ir kutilmoqda. ${escapeHtml(rubbishTomorrow.name.trim())}, musorni bugun kechqurun tashlasangiz ham bo'ladi.`
    );
  }

  if (warnings.length) {
    lines.push("");
    lines.push(...warnings);
  }

  lines.push("");
  lines.push(`💡 <i>${escapeHtml(TIPS[getDayOfYear(today) % TIPS.length])}</i>`);

  if (weather) lines.push("<i>Ob-havo: open-meteo.com</i>");

  return lines.join("\n");
};

// Kechki eslatma: faqat ertangi navbatchilar belgilanadi
export const buildEveningMessage = ({
  flatName,
  tomorrow,
  schedule,
  tasks,
  users,
  weather,
}: {
  flatName: string;
  tomorrow: string;
  schedule: Schedule;
  tasks: TaskLine[];
  users: User[];
  weather: Weather | null;
}) => {
  const mention = createMention(users);
  const lines: string[] = [];

  lines.push(`🌙 <b>${escapeHtml(flatName)}: ertangi navbatlar</b>`);
  lines.push(`📅 <b>${formatUzDate(tomorrow)}</b>`);
  if (weather) lines.push(formatWeatherLine(weather.tomorrow));
  lines.push("");

  for (const line of tasks) {
    const people = schedule[line.key] ?? [];

    if (people.length) {
      lines.push(`${line.icon} <b>${line.label}:</b> ${people.map(mention.only).join(", ")}`);
    }
  }

  if (weather?.tomorrow.wet && schedule.rubbish.length) {
    lines.push("");
    lines.push("🌧 Ertaga yomg'ir kutilmoqda, musorni bugun kechqurun tashlasangiz ham bo'ladi.");
  }

  lines.push("");
  lines.push("Unutmang, ertaga sizning navbatingiz! 💪");

  if (weather) lines.push("<i>Ob-havo: open-meteo.com</i>");

  return lines.join("\n");
};

// EDGE FUNCTION

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const getMode = async (request: Request) => {
  if (new URL(request.url).searchParams.get("mode") === "evening") return "evening";

  try {
    const body = await request.json();
    if (body?.mode === "evening") return "evening";
  } catch {
    // Body bo'lmasa, ertalabki xabar
  }

  return "morning";
};

// Bazadan kelgan kun: har bir vazifa - odamlar ro'yxati
const toSchedule = (result: Record<string, unknown> | null): Schedule => {
  const schedule: Schedule = { duty: [], rubbish: [], cleaning: [] };

  for (const [key, value] of Object.entries(result ?? {})) {
    if (key !== "date" && Array.isArray(value)) schedule[key] = value as Person[];
  }

  return schedule;
};

export const handler = async (request: Request) => {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const defaultChatId = Deno.env.get("TELEGRAM_CHAT_ID");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = Deno.env.get("SITE_URL");

  if (!botToken || !supabaseUrl || !supabaseKey) {
    return json({ error: "Kerakli secrets topilmadi" }, 500);
  }

  const supabaseHeaders = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // Supabase REST so'rovi: "JWT issued at future" bo'lsa, qayta uriniladi
  const supabaseRequest = async (path: string, init: RequestInit = {}) => {
    for (let attempt = 1; ; attempt++) {
      const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
        ...init,
        headers: supabaseHeaders,
      });

      const result = await response.json();

      if (response.ok) return result;

      if (result?.code === "PGRST303" && attempt < RETRY_ATTEMPTS) {
        await wait(RETRY_DELAY_MS * attempt);
        continue;
      }

      throw new Error(`Supabase xatoligi (${path}): ${JSON.stringify(result)}`);
    }
  };

  const sendMessage = async (chatId: string, text: string) => {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        // Sayt manzili berilgan bo'lsa, jadvalga olib boradigan tugma
        ...(siteUrl && {
          reply_markup: {
            inline_keyboard: [
              [{ text: "📅 Jadvalni ochish", url: `${siteUrl.replace(/\/$/, "")}/duties-schedule` }],
            ],
          },
        }),
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram xatoligi: ${JSON.stringify(await response.json())}`);
    }
  };

  // Bitta uy uchun xabar tayyorlab yuboradi
  const notifyFlat = async (flat: Flat, chatId: string, mode: string) => {
    const today = getLocalDate(flat.timezone);
    const tomorrow = addDays(today, 1);

    const [users, flatTasks, weather] = await Promise.all([
      supabaseRequest(`users?select=user_id,name,last_name,nickname&flat_id=eq.${flat.id}`) as Promise<User[]>,
      supabaseRequest(`flat_tasks?select=task,enabled,every_days,is_custom,name,icon,position&flat_id=eq.${flat.id}`) as Promise<FlatTask[]>,
      // Ob-havo ishlamasa ham xabar yuboriladi
      fetchWeather(flat).catch((error) => {
        console.error(error);
        return null;
      }),
    ]);

    const enabled = flatTasks.filter((item) => item.enabled);
    const tasks = toTaskLines(flatTasks);

    if (!users.length || !tasks.length) return "skipped";

    // Eng siyrak vazifaning keyingi navbati ham ko'rinishi uchun shuncha kun oldinga qaraladi
    const lookahead = Math.min(31, Math.max(2, ...enabled.map((item) => item.every_days + 1)));

    const range = (await supabaseRequest("rpc/get_duty_schedule_range", {
      method: "POST",
      body: JSON.stringify({
        p_flat: flat.id,
        start_date: today,
        end_date: addDays(today, lookahead - 1),
      }),
    })) as Record<string, unknown>[];

    const schedules = range.map(toSchedule);

    const text =
      mode === "evening"
        ? buildEveningMessage({ flatName: flat.name, tomorrow, schedule: schedules[1], tasks, users, weather })
        : buildMorningMessage({ flatName: flat.name, today, schedules, tasks, users, weather });

    await sendMessage(chatId, text);

    return "sent";
  };

  try {
    const mode = await getMode(request);

    const flats = (await supabaseRequest(
      "flats?select=id,name,timezone,latitude,longitude,telegram_chat_id&order=created_at.asc"
    )) as Flat[];

    const results: Record<string, string> = {};

    // Bir uyda xato bo'lsa ham, qolganlariga yuboriladi
    for (const [index, flat] of flats.entries()) {
      const chatId = flat.telegram_chat_id ?? (index === 0 ? defaultChatId : null);

      if (!chatId) continue;

      try {
        results[flat.name] = await notifyFlat(flat, chatId, mode);
      } catch (error) {
        console.error(flat.id, error);
        results[flat.name] = error instanceof Error ? error.message : String(error);
      }
    }

    return json({ success: true, mode, results });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
};

Deno.serve(handler);
