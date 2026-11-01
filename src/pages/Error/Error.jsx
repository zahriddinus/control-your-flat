import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";

export const Error = () => {
  const { t } = useI18n();

  return (
    <div className="container py-5">
      <h1 className="display-1 fw-bold text-primary">404</h1>

      <h2 className="h4 fw-semibold">{t("notFound.title")}</h2>

      <p className="text-muted">{t("notFound.text")}</p>

      <Link className="btn btn-primary" to="/">
        {t("notFound.back")}
      </Link>
    </div>
  );
};
