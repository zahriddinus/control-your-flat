import "./newFlat.scss";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { useFlat } from "../../context/FlatContext";
import { useI18n } from "../../i18n";
import { AppIcon, LogoIcon } from "../../components/AppIcon";
import { FlatForm, getBrowserTimezone } from "../../components/FlatForm";
import { formatDate } from "../../utils/date";

const ERROR_KEYS = {
  too_many_flats: "newFlat.errors.tooMany",
  invalid_timezone: "newFlat.errors.timezone",
  owner_name_required: "newFlat.errors.ownerName",
};

const getErrorKey = (error) =>
  Object.entries(ERROR_KEYS).find(([code]) => error?.message?.includes(code))?.[1] ??
  "newFlat.errors.unknown";

// Yangi uy: egasi o'zini ham birinchi xonadosh sifatida kiritadi
export const NewFlat = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { memberships, reload, selectFlat } = useFlat();

  const [flat, setFlat] = useState({
    name: "",
    startDate: formatDate(new Date()),
    timezone: getBrowserTimezone(),
    address: "",
    latitude: null,
    longitude: null,
  });
  const [owner, setOwner] = useState({ name: "", lastName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(evt) {
    evt.preventDefault();

    setLoading(true);
    setError(null);

    const { data: flatId, error } = await supabase.rpc("create_flat", {
      p_name: flat.name.trim(),
      p_start_date: flat.startDate,
      p_owner: { name: owner.name.trim(), last_name: owner.lastName.trim() },
      p_timezone: flat.timezone,
      p_latitude: flat.latitude,
      p_longitude: flat.longitude,
      p_address: flat.address.trim() || null,
    });

    if (error) {
      console.error(error);
      setError(getErrorKey(error));
      setLoading(false);
      return;
    }

    await reload();
    selectFlat(flatId);

    // Keyingi qadam - xonadoshlarni qo'shish
    navigate("/control-users", { replace: true, state: { welcome: true } });
  }

  return (
    <div className="new-flat container py-4 py-md-5">
      <div className="new-flat__intro text-center mb-4">
        <span className="new-flat__logo" aria-hidden="true">
          <LogoIcon />
        </span>

        <h1 className="new-flat__title">
          {memberships.length ? t("newFlat.titleAnother") : t("newFlat.title")}
        </h1>

        <p className="text-muted m-0">{t("newFlat.subtitle")}</p>
      </div>

      <form className="card border-0 shadow-sm" onSubmit={handleSubmit}>
        <div className="card-body p-3 p-md-4 text-start">
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
              <AppIcon name="alert" className="flex-shrink-0" />
              {t(error)}
            </div>
          )}

          <h2 className="new-flat__step">
            <span>1</span>
            {t("newFlat.stepFlat")}
          </h2>

          <FlatForm values={flat} onChange={setFlat} disabled={loading} />

          <h2 className="new-flat__step mt-4">
            <span>2</span>
            {t("newFlat.stepOwner")}
          </h2>

          <p className="small text-muted">{t("newFlat.ownerHint")}</p>

          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <label htmlFor="ownerName" className="form-label small fw-semibold">
                {t("newFlat.ownerName")}
              </label>
              <input
                id="ownerName"
                className="form-control"
                autoComplete="given-name"
                maxLength={40}
                value={owner.name}
                onChange={(evt) => setOwner({ ...owner, name: evt.target.value })}
                disabled={loading}
                required
              />
            </div>

            <div className="col-12 col-sm-6">
              <label htmlFor="ownerLastName" className="form-label small fw-semibold">
                {t("newFlat.ownerLastName")}
              </label>
              <input
                id="ownerLastName"
                className="form-control"
                autoComplete="family-name"
                maxLength={40}
                value={owner.lastName}
                onChange={(evt) => setOwner({ ...owner, lastName: evt.target.value })}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="card-footer bg-transparent border-0 p-3 p-md-4 pt-0">
          <button
            type="submit"
            className="new-flat__submit btn btn-primary w-100"
            disabled={loading}
          >
            {loading && (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            )}
            {loading ? t("newFlat.creating") : t("newFlat.submit")}
          </button>
        </div>
      </form>
    </div>
  );
};
