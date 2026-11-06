import "./profile.scss";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabese";
import { useAuth } from "../../context/AuthContext";
import { useFlat } from "../../context/FlatContext";
import { useI18n } from "../../i18n";
import { AppIcon } from "../../components/AppIcon";
import { Avatar } from "../../components/Avatar";
import { Notice, useNotice } from "../../components/Notice";
import { PageSkeleton } from "../../components/Skeleton";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { AVATAR_COLORS, getAvatarColorKey, getAvatarGradient } from "../../utils/avatarColors";
import { PasswordField, getAuthErrorKey } from "../Auth/AuthCard";

// Telegram nickname ("@"siz): 5-32 ta lotin harfi, raqam yoki "_"
const NICKNAME_PATTERN = /^[A-Za-z0-9_]{5,32}$/;
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;

const toForm = (resident) => ({
  name: resident.name?.trim() ?? "",
  lastName: resident.last_name?.trim() ?? "",
  age: resident.age ?? "",
  nickname: (resident.nickname ?? "").replace(/^@/, ""),
  phone: resident.phone_number ?? "",
  color: resident.avatar_color ?? "",
});

const validate = (form) => {
  const errors = {};

  if (!form.name.trim()) errors.name = "userModal.errors.name";

  if (form.age !== "" && (!Number.isInteger(Number(form.age)) || form.age < 1 || form.age > 120)) {
    errors.age = "userModal.errors.age";
  }

  if (form.nickname.trim() && !NICKNAME_PATTERN.test(form.nickname.trim())) {
    errors.nickname = "userModal.errors.nickname";
  }

  if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) {
    errors.phone = "userModal.errors.phone";
  }

  return errors;
};

// O'z ma'lumotlarim, avatar rangim, parolim va sayt sozlamalari
export const Profile = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { flat, flatId, residentId, membership, reload } = useFlat();
  const [notice, showNotice] = useNotice(3500);

  const [resident, setResident] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!residentId) return;

    supabase
      .from("users")
      .select("user_id, name, last_name, age, nickname, phone_number, avatar_color")
      .eq("user_id", residentId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }

        setResident(data);
        setForm(toForm(data));
      });
  }, [residentId]);

  if (!form) return <PageSkeleton variant="users" />;

  const set = (field) => (evt) => {
    const value = field === "nickname" ? evt.target.value.replace(/^@/, "") : evt.target.value;

    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  async function handleSave(evt) {
    evt.preventDefault();

    const newErrors = validate(form);

    setErrors(newErrors);

    if (Object.keys(newErrors).length) return;

    setSaving(true);

    const nickname = form.nickname.trim();
    const patch = {
      name: form.name.trim(),
      last_name: form.lastName.trim(),
      age: form.age === "" ? "" : String(Number(form.age)),
      nickname: nickname ? `@${nickname}` : "",
      phone_number: form.phone.trim(),
      avatar_color: form.color,
    };

    const { error } = await supabase.rpc("update_my_profile", { p_flat: flatId, p_patch: patch });

    setSaving(false);

    if (error) {
      console.error(error);
      showNotice(t("profile.saveError"), "danger");
      return;
    }

    setResident((prev) => ({ ...prev, ...patch, avatar_color: form.color || null }));
    showNotice(t("profile.saved"));

    // Sarlavhadagi ism va avatar ham yangilansin
    reload();
  }

  async function handlePassword(evt) {
    evt.preventDefault();

    if (password !== confirm) {
      showNotice(t("auth.errors.mismatch"), "danger");
      return;
    }

    setPasswordSaving(true);

    const { error } = await supabase.auth.updateUser({ password });

    setPasswordSaving(false);

    if (error) {
      console.error(error);
      showNotice(t(getAuthErrorKey(error)), "danger");
      return;
    }

    setPassword("");
    setConfirm("");
    showNotice(t("profile.passwordSaved"));
  }

  // Ko'rinish uchun: formadagi o'zgarishlar darhol avatarda aks etadi
  const preview = {
    ...resident,
    name: form.name || resident.name,
    last_name: form.lastName,
    avatar_color: form.color || null,
  };

  const fieldClass = (field) => `form-control ${errors[field] ? "is-invalid" : ""}`;
  const renderError = (field) =>
    errors[field] && <div className="invalid-feedback">{t(errors[field])}</div>;

  return (
    <div className="profile container py-3 py-md-4">
      {/* SARLAVHA */}

      <section className="profile__hero text-start">
        <Avatar user={preview} size="lg" />

        <div className="overflow-hidden">
          <h1 className="profile__name text-truncate">
            {preview.name} {preview.last_name}
          </h1>

          <span className="profile__meta">
            <AppIcon name="mail" /> {user.email}
          </span>

          <span className="profile__meta">
            <AppIcon name="home" /> {flat.name} · {t(`control.roles.${membership.role}`)}
          </span>
        </div>
      </section>

      {/* SHAXSIY MA'LUMOTLAR VA RANG */}

      <form
        className="profile__section card border-0 shadow-sm text-start"
        onSubmit={handleSave}
        noValidate
      >
        <div className="card-body p-3 p-md-4">
          <h2 className="profile__section-title">
            <AppIcon name="user" />
            {t("profile.personal")}
          </h2>

          <div className="row g-3">
            <div className="col-12 col-sm-6">
              <label htmlFor="profileName" className="form-label small fw-semibold">
                {t("userModal.name")}
              </label>
              <input
                id="profileName"
                className={fieldClass("name")}
                maxLength={40}
                value={form.name}
                onChange={set("name")}
                disabled={saving}
              />
              {renderError("name")}
            </div>

            <div className="col-12 col-sm-6">
              <label htmlFor="profileLastName" className="form-label small fw-semibold">
                {t("newFlat.ownerLastName")}
              </label>
              <input
                id="profileLastName"
                className="form-control"
                maxLength={40}
                value={form.lastName}
                onChange={set("lastName")}
                disabled={saving}
              />
            </div>

            <div className="col-12 col-sm-4">
              <label htmlFor="profileAge" className="form-label small fw-semibold">
                {t("profile.age")}
              </label>
              <input
                id="profileAge"
                type="number"
                min="1"
                max="120"
                className={fieldClass("age")}
                value={form.age}
                onChange={set("age")}
                disabled={saving}
              />
              {renderError("age")}
            </div>

            <div className="col-12 col-sm-8">
              <label htmlFor="profileNickname" className="form-label small fw-semibold">
                {t("userModal.nickname")}
              </label>
              <div className="input-group has-validation">
                <span className="input-group-text">@</span>
                <input
                  id="profileNickname"
                  className={fieldClass("nickname")}
                  placeholder="username"
                  value={form.nickname}
                  onChange={set("nickname")}
                  disabled={saving}
                />
                {renderError("nickname")}
              </div>
            </div>

            <div className="col-12">
              <label htmlFor="profilePhone" className="form-label small fw-semibold">
                {t("userModal.phone")}
              </label>
              <input
                id="profilePhone"
                type="tel"
                className={fieldClass("phone")}
                placeholder="+998 90 123 45 67"
                value={form.phone}
                onChange={set("phone")}
                disabled={saving}
              />
              {renderError("phone")}
            </div>
          </div>

          {/* Avatar rangi: "Avtomatik" yoki 10 tadan biri */}

          <h3 className="profile__subtitle">{t("profile.color")}</h3>

          <div className="profile__colors" role="radiogroup" aria-label={t("profile.color")}>
            <button
              type="button"
              className={`profile__color profile__color--auto ${!form.color ? "active" : ""}`}
              style={{
                background: getAvatarGradient(
                  getAvatarColorKey({ ...resident, avatar_color: null })
                ),
              }}
              onClick={() => setForm((prev) => ({ ...prev, color: "" }))}
              aria-pressed={!form.color}
              title={t("profile.colorAuto")}
              disabled={saving}
            >
              <AppIcon name="auto" />
            </button>

            {Object.keys(AVATAR_COLORS).map((colorKey) => (
              <button
                type="button"
                key={colorKey}
                className={`profile__color ${form.color === colorKey ? "active" : ""}`}
                style={{ background: getAvatarGradient(colorKey) }}
                onClick={() => setForm((prev) => ({ ...prev, color: colorKey }))}
                aria-pressed={form.color === colorKey}
                aria-label={colorKey}
                disabled={saving}
              >
                {form.color === colorKey && <AppIcon name="check" />}
              </button>
            ))}
          </div>

          <div className="text-end mt-4">
            <button type="submit" className="btn btn-primary px-4" disabled={saving}>
              {saving && (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              )}
              {t("settings.save")}
            </button>
          </div>
        </div>
      </form>

      {/* PAROL */}

      <form
        className="profile__section card border-0 shadow-sm text-start"
        onSubmit={handlePassword}
      >
        <div className="card-body p-3 p-md-4">
          <h2 className="profile__section-title">
            <AppIcon name="lock" />
            {t("profile.password")}
          </h2>

          <div>
            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <PasswordField
                  id="profilePassword"
                  label={t("auth.newPassword")}
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  disabled={passwordSaving}
                  hint={t("auth.passwordHint")}
                />
              </div>

              <div className="col-12 col-sm-6">
                <PasswordField
                  id="profileConfirm"
                  label={t("auth.confirmPassword")}
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                  disabled={passwordSaving}
                />
              </div>
            </div>
          </div>

          <div className="text-end">
            <button
              type="submit"
              className="btn btn-outline-primary px-4"
              disabled={passwordSaving || !password}
            >
              {passwordSaving && (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              )}
              {t("auth.reset.submit")}
            </button>
          </div>
        </div>
      </form>

      {/* SAYT: mavzu va til (telefonda menyuni ochmasdan) */}

      <section className="profile__section card border-0 shadow-sm text-start">
        <div className="card-body p-3 p-md-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <h2 className="profile__section-title m-0">
            <AppIcon name="sliders" />
            {t("profile.site")}
          </h2>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </section>

      <Notice notice={notice} />
    </div>
  );
};
