import "./userModal.scss";
import { useEffect, useState } from "react";
import { useModalEffects } from "../../hooks/useModalEffects";
import { useI18n } from "../../i18n";
import { Avatar } from "../Avatar";

const EMPTY_FORM = {
  role: "user",
  name: "",
  lastName: "",
  age: "",
  dutyOrder: "",
  nickname: "",
  phoneNumber: "",
  email: "",
};

const ROLES = [
  { value: "user", labelKey: "userModal.roleUser" },
  { value: "admin", labelKey: "userModal.roleAdmin" },
];

// Xatolar tarjima kaliti sifatida qaytadi: userModal.errors.*
// Telegram nickname ("@"siz): 5-32 ta lotin harfi, raqam yoki "_"
const NICKNAME_PATTERN = /^[A-Za-z0-9_]{5,32}$/;
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (formData) => {
  const errors = {};

  if (!formData.name.trim()) errors.name = "userModal.errors.name";
  if (!formData.lastName.trim()) errors.lastName = "userModal.errors.lastName";

  const age = Number(formData.age);

  if (!Number.isInteger(age) || age < 1 || age > 120) {
    errors.age = "userModal.errors.age";
  }

  if (formData.nickname.trim() && !NICKNAME_PATTERN.test(formData.nickname.trim())) {
    errors.nickname = "userModal.errors.nickname";
  }

  if (formData.phoneNumber.trim() && !PHONE_PATTERN.test(formData.phoneNumber.trim())) {
    errors.phoneNumber = "userModal.errors.phone";
  }

  if (formData.email.trim() && !EMAIL_PATTERN.test(formData.email.trim())) {
    errors.email = "userModal.errors.email";
  }

  return errors;
};

// Navbat raqam bilan emas, kimning oldiga yoki o'rniga qo'yilishi bilan tanlanadi.
// Qiymat - o'sha userning duty_order'i, "" - oxiriga
const getOrderOptions = (users, selectedUser, t) => {
  if (selectedUser) {
    return users.map((user, index) => ({
      value: String(user.duty_order),
      label:
        user.user_id === selectedUser.user_id
          ? t("userModal.optionCurrent", { number: index + 1 })
          : t("userModal.optionReplace", { number: index + 1, name: user.name.trim() }),
    }));
  }

  return [
    ...users.map((user, index) => ({
      value: String(user.duty_order),
      label: t("userModal.optionBefore", { number: index + 1, name: user.name.trim() }),
    })),
    { value: "", label: t("userModal.optionLast", { number: users.length + 1 }) },
  ];
};

// users: duty_order bo'yicha tartiblangan barcha userlar
export const UserModal = ({ isOpen, onClose, selectedUser, onSubmit, users = [] }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useModalEffects(isOpen, onClose, !saving);

  // Modal ochilganda yoki user o'zgarganda
  useEffect(() => {
    setErrors({});
    setSaving(false);

    if (selectedUser) {
      setFormData({
        role: selectedUser.role || "user",
        name: selectedUser.name || "",
        lastName: selectedUser.last_name || "",
        age: selectedUser.age ?? "",
        dutyOrder: String(selectedUser.duty_order ?? ""),
        nickname: (selectedUser.nickname || "").replace(/^@/, ""),
        phoneNumber: selectedUser.phone_number || "",
        email: selectedUser.email || "",
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [selectedUser, isOpen]);

  function handleChange(evt) {
    const { name } = evt.target;

    // "@" prefiks alohida turadi, shuning uchun yozilganini olib tashlaymiz
    const value = name === "nickname" ? evt.target.value.replace(/^@/, "") : evt.target.value;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Yozishni boshlaganda xato yo'qoladi
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(evt) {
    evt.preventDefault();

    const newErrors = validate(formData);

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    const nickname = formData.nickname.trim();

    setSaving(true);

    await onSubmit({
      ...formData,
      name: formData.name.trim(),
      lastName: formData.lastName.trim(),
      nickname: nickname ? `@${nickname}` : "",
      phoneNumber: formData.phoneNumber.trim(),
      email: formData.email.trim(),
    });

    setSaving(false);
  }

  const handleClose = () => {
    if (!saving) onClose();
  };

  // Har bir input uchun umumiy atributlar
  const fieldProps = (name) => ({
    id: `user-${name}`,
    name,
    value: formData[name],
    onChange: handleChange,
    disabled: saving,
    className: `form-control ${errors[name] ? "is-invalid" : ""}`,
  });

  const renderError = (name) =>
    errors[name] && <div className="invalid-feedback">{t(errors[name])}</div>;

  if (!isOpen) return null;

  const fullName = `${formData.name} ${formData.lastName}`.trim();

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        aria-labelledby="userModalLabel"
        aria-modal="true"
        role="dialog"
        onMouseDown={(evt) => evt.target === evt.currentTarget && handleClose()}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
          <form
            className="user-modal modal-content border-0 shadow"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* SARLAVHA: yozilishi bilan avatar va ism yangilanadi */}

            <div className="user-modal__header modal-header border-0">
              <div className="d-flex align-items-center gap-3 overflow-hidden">
                <span className="user-modal__avatar">
                  <Avatar user={{ name: formData.name, last_name: formData.lastName }} />
                </span>

                <div className="text-start overflow-hidden">
                  <h2 className="modal-title fs-5 fw-bold" id="userModalLabel">
                    {selectedUser ? t("userModal.editTitle") : t("userModal.addTitle")}
                  </h2>

                  <small className="user-modal__subtitle d-block text-truncate">
                    {fullName || t("userModal.enterName")}
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label={t("common.close")}
                onClick={handleClose}
                disabled={saving}
              ></button>
            </div>

            <div className="modal-body text-start">
              {/* SHAXSIY MA'LUMOTLAR */}

              <section className="user-modal__section">
                <h3 className="user-modal__section-title">{t("userModal.personal")}</h3>

                <div className="row g-2">
                  <div className="col-6">
                    <label htmlFor="user-name" className="form-label small">
                      {t("userModal.name")}
                    </label>

                    <input
                      type="text"
                      placeholder={t("userModal.namePlaceholder")}
                      {...fieldProps("name")}
                    />
                    {renderError("name")}
                  </div>

                  <div className="col-6">
                    <label htmlFor="user-lastName" className="form-label small">
                      {t("userModal.lastName")}
                    </label>

                    <input
                      type="text"
                      placeholder={t("userModal.lastNamePlaceholder")}
                      {...fieldProps("lastName")}
                    />
                    {renderError("lastName")}
                  </div>

                  <div className="col-12 col-sm-5">
                    <label htmlFor="user-age" className="form-label small">
                      {t("userModal.age")}
                    </label>

                    <div className="input-group has-validation">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="20"
                        {...fieldProps("age")}
                      />

                      <span className="input-group-text">{t("userModal.ageSuffix")}</span>
                      {renderError("age")}
                    </div>
                  </div>

                  <div className="col-12 col-sm-7">
                    <span className="form-label small d-block">{t("userModal.role")}</span>

                    <div className="btn-group w-100" role="group" aria-label={t("userModal.role")}>
                      {ROLES.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          className={`btn ${
                            formData.role === role.value ? "btn-primary" : "btn-outline-primary"
                          }`}
                          onClick={() => setFormData((prev) => ({ ...prev, role: role.value }))}
                          aria-pressed={formData.role === role.value}
                          disabled={saving}
                        >
                          {t(role.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {formData.role === "admin" && (
                  <div className="alert alert-warning small py-2 mt-3 mb-0">
                    {t("userModal.adminWarning")}
                  </div>
                )}
              </section>

              {/* ALOQA */}

              <section className="user-modal__section">
                <h3 className="user-modal__section-title">{t("userModal.contact")}</h3>

                <label htmlFor="user-nickname" className="form-label small">
                  {t("userModal.nickname")}
                </label>

                <div className="input-group has-validation mb-2">
                  <span className="input-group-text">@</span>

                  <input type="text" placeholder="username" {...fieldProps("nickname")} />
                  {renderError("nickname")}
                </div>

                <label htmlFor="user-phoneNumber" className="form-label small">
                  {t("userModal.phone")}
                </label>

                <div className="input-group has-validation mb-2">
                  <span className="input-group-text" aria-hidden="true">
                    📞
                  </span>

                  <input
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    {...fieldProps("phoneNumber")}
                  />
                  {renderError("phoneNumber")}
                </div>

                <label htmlFor="user-email" className="form-label small">
                  {t("userModal.email")}
                </label>

                <div className="input-group has-validation">
                  <span className="input-group-text" aria-hidden="true">
                    ✉️
                  </span>

                  <input type="email" placeholder="example@gmail.com" {...fieldProps("email")} />
                  {renderError("email")}
                </div>
              </section>

              {/* NAVBAT */}

              <section className="user-modal__section mb-0">
                <h3 className="user-modal__section-title">{t("userModal.order")}</h3>

                <label htmlFor="user-dutyOrder" className="form-label small">
                  {selectedUser ? t("userModal.orderEdit") : t("userModal.orderAdd")}
                </label>

                <select
                  id="user-dutyOrder"
                  className="form-select"
                  name="dutyOrder"
                  value={formData.dutyOrder}
                  onChange={handleChange}
                  disabled={saving}
                >
                  {getOrderOptions(users, selectedUser, t).map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <small className="text-muted d-block mt-1">{t("userModal.orderHint")}</small>
              </section>
            </div>

            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-light"
                onClick={handleClose}
                disabled={saving}
              >
                {t("common.cancel")}
              </button>

              <button
                type="submit"
                className="user-modal__submit btn btn-primary px-4"
                disabled={saving}
              >
                {saving && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                )}
                {selectedUser ? t("userModal.save") : t("userModal.add")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
};
