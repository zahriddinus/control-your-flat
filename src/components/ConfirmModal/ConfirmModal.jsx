import { createPortal } from "react-dom";
import "./confirmModal.scss";
import { useModalEffects } from "../../hooks/useModalEffects";
import { useI18n } from "../../i18n";
import { AppIcon } from "../AppIcon";

export const ConfirmModal = ({
  isOpen,
  title,
  // AppIcon nomi: sarlavha oldida tasdiqlash rangidagi doirada chiqadi
  icon,
  children,
  confirmLabel,
  // "danger" (o'chirish) yoki "primary" (oddiy tasdiqlash)
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { t } = useI18n();

  useModalEffects(isOpen, onCancel, !loading);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (!loading) onCancel();
  };

  // Sahifaning eng yuqori qatlamida: header kabi ota elementlar stillari oynani buzmaydi
  return createPortal(
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmModalLabel"
        onMouseDown={(evt) => evt.target === evt.currentTarget && handleCancel()}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow rounded-4">
            <div className="modal-header border-0 pb-0">
              <h2
                className="modal-title fs-5 fw-bold d-flex align-items-center gap-2"
                id="confirmModalLabel"
              >
                {icon && (
                  <span
                    className={`confirm-modal__icon confirm-modal__icon--${confirmVariant}`}
                    aria-hidden="true"
                  >
                    <AppIcon name={icon} />
                  </span>
                )}
                {title}
              </h2>

              <button
                type="button"
                className="btn-close"
                aria-label={t("common.close")}
                onClick={handleCancel}
                disabled={loading}
              ></button>
            </div>

            <div className="modal-body text-start">{children}</div>

            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-light"
                onClick={handleCancel}
                disabled={loading}
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                className={`btn btn-${confirmVariant} px-4`}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                )}
                {confirmLabel ?? t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>,
    document.body
  );
};
