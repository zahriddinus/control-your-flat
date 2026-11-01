import { useI18n } from "../../i18n";

export const Loading = () => {
  const { t } = useI18n();

  return (
    <div
      className="d-flex justify-content-center align-items-center flex-column"
      style={{ height: "90vh" }}
    >
      <div
        className="spinner-grow text-primary mb-3"
        style={{ width: "3rem", height: "3rem" }}
        role="status"
      >
        <span className="visually-hidden">{t("common.loading")}</span>
      </div>

      <h3 className="text-primary">{t("common.loading")}</h3>
    </div>
  );
};
