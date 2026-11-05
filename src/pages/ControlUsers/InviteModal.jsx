import { useEffect, useState } from "react";
import { useModalEffects } from "../../hooks/useModalEffects";
import { useI18n } from "../../i18n";
import { AppIcon } from "../../components/AppIcon";
import { Avatar } from "../../components/Avatar";

// Xonadosh uchun taklif havolasi: nusxalash, Telegram yoki telefon orqali ulashish
export const InviteModal = ({ invite, flatName, onClose }) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  useModalEffects(Boolean(invite), onClose);

  useEffect(() => setCopied(false), [invite]);

  if (!invite) return null;

  const { user, link } = invite;
  const shareText = t("invite.shareText", { name: user.name.trim(), flat: flatName });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleShare() {
    try {
      await navigator.share({ title: "Control Your Flat", text: shareText, url: link });
    } catch {
      // Foydalanuvchi bekor qildi
    }
  }

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`;

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inviteModalLabel"
        onMouseDown={(evt) => evt.target === evt.currentTarget && onClose()}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow rounded-4">
            <div className="modal-header border-0 pb-0">
              <h2
                className="modal-title fs-5 fw-bold d-flex align-items-center gap-2"
                id="inviteModalLabel"
              >
                <span
                  className="confirm-modal__icon confirm-modal__icon--primary"
                  aria-hidden="true"
                >
                  <AppIcon name="send" />
                </span>
                {t("invite.modalTitle")}
              </h2>

              <button
                type="button"
                className="btn-close"
                aria-label={t("common.close")}
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body text-start">
              <div className="d-flex align-items-center gap-3 mb-3">
                <Avatar user={user} />

                <p className="m-0">
                  {t("invite.modalText", { name: `${user.name} ${user.last_name}` })}
                </p>
              </div>

              <div className="input-group mb-2">
                <input
                  className="form-control"
                  value={link}
                  readOnly
                  onFocus={(evt) => evt.target.select()}
                  aria-label={t("invite.linkLabel")}
                />

                <button
                  type="button"
                  className={`btn ${copied ? "btn-success" : "btn-outline-primary"}`}
                  onClick={handleCopy}
                >
                  <AppIcon name={copied ? "check" : "table"} className="me-1" />
                  {copied ? t("invite.copied") : t("invite.copy")}
                </button>
              </div>

              <small className="text-muted d-block mb-3">{t("invite.expires")}</small>

              <div className="d-flex flex-wrap gap-2">
                <a
                  className="btn btn-sm text-white"
                  style={{ backgroundColor: "#229ed9" }}
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AppIcon name="send" className="me-1" />
                  Telegram
                </a>

                {typeof navigator.share === "function" && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleShare}
                  >
                    {t("invite.share")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
};
