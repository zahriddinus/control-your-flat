// Xonadon navbatlari: Telegram guruhiga kunlik xabar (Supabase Edge Function).
//
// Ertalab (sukut bo'yicha): bugungi navbatchilar @nickname bilan belgilanadi, ertangi navbatlar
// qisqacha, ob-havo, yomg'ir haqida ogohlantirish va kun maslahati.
// Kechqurun (body: {"mode":"evening"} yoki ?mode=evening): faqat ertangi navbatchilarga eslatma.
//
// Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SUPABASE_URL va SUPABASE_ANON_KEY
// (Supabase o'zi beradi). Navbatlar va nickname'lar ochiq ma'lumot, admin kaliti shart emas;
// SUPABASE_ANON_KEY bo'lmasa, SUPABASE_SERVICE_ROLE_KEY ishlatiladi.
// Ixtiyoriy: SITE_URL (masalan https://control-your-flat.vercel.app) - "Jadvalni ochish" tugmasi.

type User = { user_id: string; name: string; last_name: string | null; nickname: string | null };
type Person = { user_id: string; name: string; last_name: string | null };
type Schedule = { duty: Person | null; rubbish: Person | null; cleaning: Person[] };
type WeatherDay = { icon: string; label: string; min: number; max: number; rain: number; wet: boolean };
type Weather = { today: WeatherDay; tomorrow: WeatherDay };

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

// Toshkent, Sergeli
const FLAT = { latitude: 41.22, longitude: 69.22 };

// Generalniy uborka qancha kun oldindan qidiriladi
const LOOKAHEAD_DAYS = 8;

// Supabase serverlari soatidagi kichik farq tufayli ba'zan "JWT issued at future" (PGRST303)
// qaytadi. Bu vaqtinchalik: biroz kutib, qayta uriniladi
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// SANALAR ("2026-11-02" ko'rinishidagi Toshkent sanalari)

export const getTashkentDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
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

export const fetchWeather = async (): Promise<Weather> => {
  const params = new URLSearchParams({
    latitude: String(FLAT.latitude),
    longitude: String(FLAT.longitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "2",
    timezone: "Asia/Tashkent",
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

// Ertalabki xabar. schedules[0] - bugun, schedules[1] - ertaga, keyingilari uborkani qidirish uchun
export const buildMorningMessage = ({
  today,
  schedules,
  users,
  weather,
}: {
  today: string;
  schedules: Schedule[];
  users: User[];
  weather: Weather | null;
}) => {
  const mention = createMention(users);
  const [todaySchedule, tomorrowSchedule] = schedules;
  const lines: string[] = [];

  lines.push("🏠 <b>Xonadon navbatlari</b>");
  lines.push(`📅 <b>${formatUzDate(today)}</b>`);
  if (weather) lines.push(formatWeatherLine(weather.today));
  lines.push("");

  // Bugungi navbatchilar belgilanadi
  lines.push(
    `⭐ <b>Navbatchi:</b> ${todaySchedule.duty ? mention.withName(todaySchedule.duty) : "—"}`
  );
  lines.push(
    `🗑 <b>Musor:</b> ${todaySchedule.rubbish ? mention.withName(todaySchedule.rubbish) : "bugun yo'q"}`
  );

  // Uborka bugun bo'lmasa, keyingisi qachonligi
  let cleaning: string;

  if (todaySchedule.cleaning.length) {
    cleaning = todaySchedule.cleaning.map(mention.withName).join(" va ");
  } else {
    const nextIndex = schedules.findIndex((schedule) => schedule.cleaning.length > 0);

    if (nextIndex === -1) {
      cleaning = "yaqin kunlarda yo'q";
    } else {
      const when = nextIndex === 1 ? "ertaga" : `${nextIndex} kundan keyin`;
      const names = schedules[nextIndex].cleaning
        .map((person) => escapeHtml(person.name.trim()))
        .join(" va ");
      cleaning = `${when} (${names})`;
    }
  }

  lines.push(`🧹 <b>Uborka:</b> ${cleaning}`);

  // Ertangi navbatlar qisqacha, iqtibos ichida (belgilanmaydi: kechki eslatmada belgilanadi)
  const tomorrowLines = [`🔜 <b>Ertaga</b> · ${formatUzDate(addDays(today, 1))}`];

  if (tomorrowSchedule.duty) tomorrowLines.push(`⭐ ${fullName(tomorrowSchedule.duty)}`);
  if (tomorrowSchedule.rubbish) tomorrowLines.push(`🗑 ${fullName(tomorrowSchedule.rubbish)}`);
  if (tomorrowSchedule.cleaning.length) {
    tomorrowLines.push(`🧹 ${tomorrowSchedule.cleaning.map(fullName).join(" va ")}`);
  }

  lines.push("");
  lines.push(`<blockquote>${tomorrowLines.join("\n")}</blockquote>`);

  // Ob-havoni navbat bilan bog'laydigan ogohlantirishlar
  const warnings: string[] = [];

  if (weather?.today.wet && todaySchedule.rubbish) {
    warnings.push(
      `☔ Bugun yomg'ir ehtimoli bor. ${escapeHtml(todaySchedule.rubbish.name.trim())}, musorga soyabon bilan chiqing.`
    );
  }

  if (weather?.tomorrow.wet && tomorrowSchedule.rubbish) {
    warnings.push(
      `🌧 Ertaga yomg'ir kutilmoqda. ${escapeHtml(tomorrowSchedule.rubbish.name.trim())}, musorni bugun kechqurun tashlasangiz ham bo'ladi.`
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
  tomorrow,
  schedule,
  users,
  weather,
}: {
  tomorrow: string;
  schedule: Schedule;
  users: User[];
  weather: Weather | null;
}) => {
  const mention = createMention(users);
  const lines: string[] = [];

  lines.push("🌙 <b>Ertangi navbatlar</b>");
  lines.push(`📅 <b>${formatUzDate(tomorrow)}</b>`);
  if (weather) lines.push(formatWeatherLine(weather.tomorrow));
  lines.push("");

  if (schedule.duty) lines.push(`⭐ <b>Navbatchi:</b> ${mention.only(schedule.duty)}`);
  if (schedule.rubbish) lines.push(`🗑 <b>Musor:</b> ${mention.only(schedule.rubbish)}`);
  if (schedule.cleaning.length) {
    lines.push(`🧹 <b>Uborka:</b> ${schedule.cleaning.map(mention.only).join(", ")}`);
  }

  if (weather?.tomorrow.wet && schedule.rubbish) {
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

export const handler = async (request: Request) => {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey =
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = Deno.env.get("SITE_URL");

  if (!botToken || !chatId || !supabaseUrl || !supabaseKey) {
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

  const getSchedule = async (targetDate: string): Promise<Schedule> => {
    const result = await supabaseRequest("rpc/get_duty_schedule", {
      method: "POST",
      body: JSON.stringify({ target_date: targetDate }),
    });

    return { duty: result.duty, rubbish: result.rubbish, cleaning: result.cleaning ?? [] };
  };

  const getUsers = (): Promise<User[]> =>
    supabaseRequest("users?select=user_id,name,last_name,nickname");

  try {
    const mode = await getMode(request);
    const today = getTashkentDate();
    const tomorrow = addDays(today, 1);

    const [users, schedules, weather] = await Promise.all([
      getUsers(),
      Promise.all(
        Array.from({ length: LOOKAHEAD_DAYS }, (_, index) => getSchedule(addDays(today, index)))
      ),
      // Ob-havo ishlamasa ham xabar yuboriladi
      fetchWeather().catch((error) => {
        console.error(error);
        return null;
      }),
    ]);

    const text =
      mode === "evening"
        ? buildEveningMessage({ tomorrow, schedule: schedules[1], users, weather })
        : buildMorningMessage({ today, schedules, users, weather });

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok) {
      return json({ error: "Telegram xatoligi", details: telegramResult }, telegramResponse.status);
    }

    return json({ success: true, mode, today, tomorrow });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
};

Deno.serve(handler);
