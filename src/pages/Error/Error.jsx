import { Link } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { useI18n } from "../../i18n";

export const Error = () => {
  const { t } = useI18n();

  return (
    <div className="container py-5">
      <EmptyState
        variant="notFound"
        title={`404 · ${t("notFound.title")}`}
        text={t("notFound.text")}
        action={
          <Link className="btn btn-primary btn-sm px-4" to="/">
            {t("notFound.back")}
          </Link>
        }
      />
    </div>
  );
};
