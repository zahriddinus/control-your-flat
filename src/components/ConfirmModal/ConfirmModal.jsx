import { useModalEffects } from "../../hooks/useModalEffects";

export const ConfirmModal = ({
  isOpen,
  title,
  children,
  confirmLabel = "Tasdiqlash",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useModalEffects(isOpen, onCancel, !loading);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (!loading) onCancel();
  };

  return (
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
              <h2 className="modal-title fs-5 fw-bold" id="confirmModalLabel">
                {title}
              </h2>

              <button
                type="button"
                className="btn-close"
                aria-label="Yopish"
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
                Bekor qilish
              </button>

              <button
                type="button"
                className="btn btn-danger px-4"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                )}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
};
