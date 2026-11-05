import "./whoAmI.scss";
import { useModalEffects } from "../../hooks/useModalEffects";
import { useI18n } from "../../i18n";
import { AppIcon } from "../AppIcon";
import { Avatar } from "../Avatar";

// "Men kimman?" oynasi: avatarni bosish bilan sayt shu odamga moslashadi
export const WhoAmI = ({ isOpen, users, currentId, onSelect, onClose }) => {
  const { t } = useI18n();

  useModalEffects(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whoAmILabel"
        onMouseDown={(evt) => evt.target === evt.currentTarget && onClose()}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="who-am-i modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="who-am-i__header text-start">
              <span className="who-am-i__badge" aria-hidden="true">
                <AppIcon name="user" />
              </span>

              <h2 className="who-am-i__title" id="whoAmILabel">
                {t("whoAmI.title")}
              </h2>

              <p className="who-am-i__text m-0">{t("whoAmI.text")}</p>

              <button
                type="button"
                className="who-am-i__close"
                aria-label={t("common.close")}
                onClick={onClose}
              >
                <AppIcon name="close" />
              </button>
            </div>

            <div className="who-am-i__grid">
              {users.map((user, index) => {
                const isCurrent = user.user_id === currentId;

                return (
                  <button
                    type="button"
                    key={user.user_id}
                    className={`who-am-i__person ${isCurrent ? "who-am-i__person--current" : ""}`}
                    style={{ "--i": index }}
                    onClick={() => onSelect(user.user_id)}
                    aria-pressed={isCurrent}
                  >
                    <span className="who-am-i__avatar">
                      <Avatar user={user} size="lg" />

                      {isCurrent && (
                        <span className="who-am-i__check" aria-hidden="true">
                          <AppIcon name="check" />
                        </span>
                      )}
                    </span>

                    <span className="who-am-i__name">{user.name.trim()}</span>
                    <span className="who-am-i__last-name">{user.last_name}</span>
                  </button>
                );
              })}
            </div>

            <div className="who-am-i__footer">
              <small className="text-muted">{t("whoAmI.privacy")}</small>

              <button type="button" className="btn btn-light btn-sm" onClick={onClose}>
                {t("whoAmI.later")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
};
