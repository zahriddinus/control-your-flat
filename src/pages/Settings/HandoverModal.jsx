import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabese";
import { useModalEffects } from "../../hooks/useModalEffects";
import { useI18n } from "../../i18n";
import { AppIcon } from "../../components/AppIcon";
import { Avatar } from "../../components/Avatar";

// Ega uydan chiqishdan oldin egalikni boshqaruvchilardan biriga beradi (bir bosishda)
export const HandoverModal = ({ isOpen, flat, onClose, onDone }) => {
  const { t } = useI18n();
  const [admins, setAdmins] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useModalEffects(isOpen, onClose, !saving);

  useEffect(() => {
    if (!isOpen) return;

    setAdmins(null);
    setSelectedId(null);
    setError(false);

    supabase
      .from("flat_members")
      .select("auth_user_id, resident:users(name, last_name)")
      .eq("flat_id", flat.id)
      .eq("role", "admin")
      .then(({ data, error }) => {
        if (error) console.error(error);

        setAdmins(data ?? []);
        setSelectedId(data?.[0]?.auth_user_id ?? null);
      });
  }, [isOpen, flat]);

  async function handleConfirm() {
    setSaving(true);
    setError(false);

    const { error } = await supabase.rpc("transfer_and_leave", {
      p_flat: flat.id,
      p_auth_user_id: selectedId,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      setError(true);
      return;
    }

    onDone();
  }

  if (!isOpen) return null;

  const handleClose = () => {
    if (!saving) onClose();
  };

  // Sahifaning eng yuqori qatlamida: header kabi ota elementlar stillari oynani buzmaydi
  return createPortal(
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="handoverModalLabel"
        onMouseDown={(evt) => evt.target === evt.currentTarget && handleClose()}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow rounded-4 text-start">
            <div className="modal-header border-0 pb-0">
              <h2
                className="modal-title fs-5 fw-bold d-flex align-items-center gap-2"
                id="handoverModalLabel"
              >
                <span
                  className="confirm-modal__icon confirm-modal__icon--danger"
                  aria-hidden="true"
                >
                  <AppIcon name="logout" />
                </span>
                {t("handover.title")}
              </h2>

              <button
                type="button"
                className="btn-close"
                aria-label={t("common.close")}
                onClick={handleClose}
                disabled={saving}
              ></button>
            </div>

            <div className="modal-body">
              {admins === null && (
                <div className="text-center py-3">
                  <span
                    className="spinner-border spinner-border-sm text-primary"
                    aria-hidden="true"
                  ></span>
                </div>
              )}

              {admins?.length === 0 && (
                <div className="handover__empty">
                  <span className="handover__empty-icon" aria-hidden="true">
                    <AppIcon name="users" />
                  </span>

                  <p className="text-muted mb-3">{t("handover.noAdmins")}</p>

                  <Link
                    className="btn btn-primary btn-sm px-3"
                    to="/control-users"
                    onClick={onClose}
                  >
                    {t("members.goInvite")}
                  </Link>
                </div>
              )}

              {admins?.length > 0 && (
                <>
                  <p className="small text-muted">{t("handover.text", { name: flat.name })}</p>

                  <div
                    className="d-flex flex-column gap-2"
                    role="radiogroup"
                    aria-label={t("handover.title")}
                  >
                    {admins.map((admin) => (
                      <label
                        key={admin.auth_user_id}
                        className={`handover__option ${selectedId === admin.auth_user_id ? "handover__option--active" : ""}`}
                      >
                        <input
                          type="radio"
                          className="form-check-input m-0"
                          name="handover"
                          checked={selectedId === admin.auth_user_id}
                          onChange={() => setSelectedId(admin.auth_user_id)}
                          disabled={saving}
                        />
                        <Avatar user={admin.resident ?? { name: "?" }} size="sm" />
                        <span className="fw-semibold">
                          {admin.resident
                            ? `${admin.resident.name.trim()} ${admin.resident.last_name ?? ""}`
                            : "—"}
                        </span>
                      </label>
                    ))}
                  </div>

                  {error && (
                    <div className="alert alert-danger py-2 mt-3 mb-0">{t("members.error")}</div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-light"
                onClick={handleClose}
                disabled={saving}
              >
                {t("common.cancel")}
              </button>

              {admins?.length > 0 && (
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  onClick={handleConfirm}
                  disabled={saving || !selectedId}
                >
                  {saving && (
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    ></span>
                  )}
                  {t("handover.confirm")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>,
    document.body
  );
};
