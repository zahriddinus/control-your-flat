import "./flatForm.scss";
import { useMemo, useState } from "react";
import { useI18n } from "../../i18n";
import { fetchAddress } from "../../utils/geocode";
import { AppIcon } from "../AppIcon";

const FALLBACK_TIMEZONES = [
  "Asia/Tashkent",
  "Asia/Samarkand",
  "Asia/Almaty",
  "Asia/Bishkek",
  "Asia/Dushanbe",
  "Asia/Dubai",
  "Europe/Moscow",
  "Europe/Istanbul",
  "Europe/London",
  "America/New_York",
];

const getTimezones = () => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return FALLBACK_TIMEZONES;
  }
};

export const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tashkent";
  } catch {
    return "Asia/Tashkent";
  }
};

// Uy ma'lumotlari: nomi, boshlanish sanasi, vaqt mintaqasi, manzil va joylashuv (ob-havo uchun).
// values: { name, startDate, timezone, address, latitude, longitude }
export const FlatForm = ({ values, onChange, disabled }) => {
  const { t, lang } = useI18n();
  const timezones = useMemo(getTimezones, []);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const set = (field) => (evt) => onChange({ ...values, [field]: evt.target.value });

  // Hozirgi joylashuv: koordinatalar va (bo'sh bo'lsa) manzil
  function handleLocate() {
    if (!navigator.geolocation) {
      setGeoError("flatForm.geoUnsupported");
      return;
    }

    setGeoError("");
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(4));
        const longitude = Number(position.coords.longitude.toFixed(4));
        let address = values.address;

        if (!address.trim()) {
          try {
            const result = await fetchAddress(latitude, longitude, lang);

            address = result ? [result.title, result.subtitle].filter(Boolean).join(", ") : "";
          } catch (error) {
            console.error(error);
          }
        }

        setLocating(false);
        onChange({ ...values, latitude, longitude, address });
      },
      () => {
        setLocating(false);
        setGeoError("flatForm.geoDenied");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  const hasLocation = values.latitude != null && values.longitude != null;

  return (
    <div className="flat-form text-start">
      <div className="row g-3">
        <div className="col-12">
          <label htmlFor="flatName" className="form-label small fw-semibold">
            {t("flatForm.name")}
          </label>
          <input
            id="flatName"
            className="form-control"
            maxLength={60}
            placeholder={t("flatForm.namePlaceholder")}
            value={values.name}
            onChange={set("name")}
            disabled={disabled}
            required
          />
        </div>

        <div className="col-12 col-sm-6">
          <label htmlFor="flatStart" className="form-label small fw-semibold">
            {t("flatForm.startDate")}
          </label>
          <input
            id="flatStart"
            type="date"
            className="form-control"
            value={values.startDate}
            onChange={set("startDate")}
            disabled={disabled}
            required
          />
          <small className="form-text">{t("flatForm.startDateHint")}</small>
        </div>

        <div className="col-12 col-sm-6">
          <label htmlFor="flatTimezone" className="form-label small fw-semibold">
            {t("flatForm.timezone")}
          </label>
          <select
            id="flatTimezone"
            className="form-select"
            value={values.timezone}
            onChange={set("timezone")}
            disabled={disabled}
          >
            {!timezones.includes(values.timezone) && (
              <option value={values.timezone}>{values.timezone}</option>
            )}

            {timezones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12">
          <label htmlFor="flatAddress" className="form-label small fw-semibold">
            {t("flatForm.address")}
          </label>

          <div className="input-group">
            <input
              id="flatAddress"
              className="form-control"
              maxLength={200}
              placeholder={t("flatForm.addressPlaceholder")}
              value={values.address}
              onChange={set("address")}
              disabled={disabled}
            />

            <button
              type="button"
              className="btn btn-outline-primary d-inline-flex align-items-center gap-1"
              onClick={handleLocate}
              disabled={disabled || locating}
            >
              {locating ? (
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
              ) : (
                <AppIcon name="pin" />
              )}
              <span className="d-none d-sm-inline">{t("flatForm.locate")}</span>
            </button>
          </div>

          <small className={`form-text ${geoError ? "text-danger" : ""}`}>
            {geoError
              ? t(geoError)
              : hasLocation
                ? t("flatForm.locationSet", {
                    lat: values.latitude.toFixed(2),
                    lon: values.longitude.toFixed(2),
                  })
                : t("flatForm.locationHint")}
          </small>
        </div>
      </div>
    </div>
  );
};
