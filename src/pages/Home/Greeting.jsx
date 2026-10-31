import { formatUzDate, getDayOfYear } from "../../utils/date";

// Har kuni bittasi navbat bilan chiqadi
const TIPS = [
  "Idishlarni o'sha kuni yuving, ertaga ular ikki barobar ko'p bo'ladi 🍽️",
  "Oshxonadan chiqishdan oldin stolni artib qo'ying ✨",
  "Musor paketi to'lsa, navbatni kutmasdan tashlab yuboring 🗑️",
  "Kechqurun shovqinni kamaytiring, kimdir dam olayotgan bo'lishi mumkin 🤫",
  "Muzlatgichdagi eski ovqatlarni haftada bir marta tekshiring 🧊",
  "Boshqalarning narsasini so'ramasdan olmang 🙏",
  "Hammom va hojatxonani o'zingizdan keyin toza qoldiring 🚿",
  "Chiroq va suvni behuda yoqib qoldirmang 💡",
  "Navbatni almashtirmoqchi bo'lsangiz, oldindan kelishib oling 🤝",
  "Yuvilgan kiyimlarni quritgichda uzoq qoldirmang 👕",
];

const getGreeting = (hour) => {
  if (hour >= 5 && hour < 11) return "Xayrli tong ☀️";
  if (hour >= 11 && hour < 17) return "Xayrli kun 🌤️";
  if (hour >= 17 && hour < 22) return "Xayrli kech 🌇";

  return "Xayrli tun 🌙";
};

export const Greeting = ({ now }) => {
  const tip = TIPS[getDayOfYear(now) % TIPS.length];

  return (
    <section className="home__greeting card border-0 shadow-sm mb-4 text-start">
      <div className="card-body p-3 p-md-4">
        <p className="home__date mb-1">{formatUzDate(now)}</p>

        <h1 className="home__title fw-bold mb-1">{getGreeting(now.getHours())}, xonadoshlar!</h1>

        <p className="home__subtitle mb-3">Uydagi barcha navbatlar bir joyda.</p>

        <div className="home__tip">
          <small className="fw-semibold d-block mb-1">💡 Kun maslahati</small>

          <span>{tip}</span>
        </div>
      </div>
    </section>
  );
};
