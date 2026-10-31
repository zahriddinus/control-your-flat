import { useEffect, useRef, useState } from "react";
import { WeatherIcon } from "../../components/WeatherIcon";
import { fetchAddress } from "../../utils/geocode";
import {
  FLAT_LOCATION,
  fetchWeather,
  getDailyWeather,
  getWeatherInfo,
  getWeatherTips,
} from "../../utils/weather";

// Ob-havo har 30 daqiqada yangilanadi
const REFRESH_INTERVAL = 30 * 60 * 1000;

const GEO_ERRORS = {
  1: "Joylashuvga ruxsat berilmadi.",
  2: "Joylashuvni aniqlab bo'lmadi.",
  3: "Joylashuvni aniqlash juda uzoq davom etdi.",
};

// Kichik belgilar: uy, joylashuv, yomg'ir tomchisi, shamol
const SMALL_ICONS = {
  home: <path d="M8 1.5 1 7.5h2V14h4v-4h2v4h4V7.5h2z" />,
  pin: (
    <path
      fillRule="evenodd"
      d="M8 15s5-5 5-9A5 5 0 0 0 3 6c0 4 5 9 5 9zm0-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
    />
  ),
  drop: <path d="M8 1.5S3 7 3 10a5 5 0 0 0 10 0c0-3-5-8.5-5-8.5z" />,
  wind: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M1.5 6h8.5a2 2 0 1 0-2-2" />
      <path d="M1.5 10h11a2 2 0 1 1-2 2" />
    </g>
  ),
};

const SmallIcon = ({ name }) => (
  <svg
    className={`home__small-icon home__small-icon--${name}`}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    {SMALL_ICONS[name]}
  </svg>
);

export const WeatherCard = ({ users, schedules }) => {
  const [location, setLocation] = useState(FLAT_LOCATION);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [address, setAddress] = useState(null);

  // Manzil kech kelsa va bu orada "Uy ob-havosi" bosilgan bo'lsa, eski javob e'tiborsiz qoladi
  const addressRequest = useRef(0);

  const canLocate = "geolocation" in navigator;

  useEffect(() => {
    let cancelled = false;

    const getWeather = async () => {
      try {
        const data = await fetchWeather(location);

        if (cancelled) return;

        setWeather(data);
        setError(null);
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        setError(error);
      }
    };

    getWeather();

    const timer = setInterval(getWeather, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [location]);

  // Ruxsat faqat tugma bosilganda so'raladi
  function handleMyLocation() {
    setGeoError("");
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const requestId = ++addressRequest.current;

        setLocating(false);
        setWeather(null);
        setAddress(null);
        setLocation({ name: "Sizning joylashuvingiz", latitude, longitude, isFlat: false });

        // Ob-havo darhol chiqadi, manzil tayyor bo'lgach sarlavha almashadi
        fetchAddress(latitude, longitude)
          .then((result) => {
            if (requestId === addressRequest.current) setAddress(result);
          })
          .catch((error) => console.error(error));
      },
      (geolocationError) => {
        setLocating(false);
        setGeoError(GEO_ERRORS[geolocationError.code] ?? GEO_ERRORS[2]);
      },
      { timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  }

  function handleFlatLocation() {
    addressRequest.current += 1;
    setAddress(null);
    setGeoError("");
    setWeather(null);
    setLocation(FLAT_LOCATION);
  }

  const current = weather?.current;
  const isNight = current?.is_day === 0;
  const currentInfo = current && getWeatherInfo(current.weather_code);

  const days = weather
    ? [0, 1].map((index) => ({
        label: index === 0 ? "Bugun" : "Ertaga",
        ...getDailyWeather(weather, index),
      }))
    : [];

  const tips = weather
    ? getWeatherTips({ weather, users, schedules, isFlat: location.isFlat })
    : [];

  const renderContent = () => {
    if (error) {
      return <p className="m-0">Ob-havo ma'lumotini yuklab bo'lmadi. Keyinroq urinib ko'ring.</p>;
    }

    if (!weather) {
      return (
        <p className="placeholder-glow m-0">
          <span className="placeholder col-4 me-2"></span>
          <span className="placeholder col-6"></span>
        </p>
      );
    }

    return (
      <>
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5 d-flex align-items-center gap-3">
            <WeatherIcon type={currentInfo.type} isDay={!isNight} size="lg" />

            <div>
              <div className="home__weather-temp">{Math.round(current.temperature_2m)}°</div>

              <div className="fw-semibold">{currentInfo.label}</div>

              <small className="home__weather-muted d-flex flex-wrap align-items-center gap-1">
                His qilinadi: {Math.round(current.apparent_temperature)}° ·
                <SmallIcon name="wind" />
                {Math.round(current.wind_speed_10m)} km/soat
              </small>
            </div>
          </div>

          <div className="col-12 col-md-7">
            <div className="row g-2">
              {days.map((day) => (
                <div className="col-6" key={day.label}>
                  <div className="home__weather-day">
                    <small className="fw-semibold d-block">{day.label}</small>

                    <WeatherIcon type={getWeatherInfo(day.code).type} />

                    <div>
                      <strong>{day.max}°</strong> / {day.min}°
                    </div>

                    <small className="home__weather-muted d-inline-flex align-items-center gap-1">
                      <SmallIcon name="drop" />
                      {day.rain ?? "—"}%
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {tips.length > 0 && (
          <ul className="home__weather-tips list-unstyled mt-3 mb-0">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        )}
      </>
    );
  };

  return (
    <section
      className={`home__weather card border-0 shadow-sm mb-4 text-start ${
        isNight ? "home__weather--night" : ""
      }`}
    >
      <div className="card-body p-3 p-md-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div className="home__weather-place">
            <h2
              className="home__section-title d-flex align-items-center gap-2 m-0"
              title={address ? `${address.title}, ${address.subtitle}` : undefined}
            >
              <SmallIcon name={location.isFlat ? "home" : "pin"} />
              <span className="text-truncate">{address?.title ?? location.name}</span>
            </h2>

            {address?.subtitle && (
              <small className="home__weather-muted d-block text-truncate">
                {address.subtitle}
              </small>
            )}
          </div>

          {canLocate &&
            (location.isFlat ? (
              <button
                className="home__weather-btn btn btn-sm d-inline-flex align-items-center gap-1"
                type="button"
                onClick={handleMyLocation}
                disabled={locating}
              >
                {locating ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      aria-hidden="true"
                    ></span>
                    Aniqlanmoqda...
                  </>
                ) : (
                  <>
                    <SmallIcon name="pin" />
                    Mening joylashuvim
                  </>
                )}
              </button>
            ) : (
              <button
                className="home__weather-btn btn btn-sm d-inline-flex align-items-center gap-1"
                type="button"
                onClick={handleFlatLocation}
              >
                <SmallIcon name="home" />
                Uy ob-havosi
              </button>
            ))}
        </div>

        {geoError && (
          <div className="alert alert-warning small py-2">
            {geoError} Uy ob-havosi ko'rsatilmoqda.
          </div>
        )}

        {/* Ma'lumot manbalari sayt footer'ida ko'rsatiladi */}
        {renderContent()}
      </div>
    </section>
  );
};
