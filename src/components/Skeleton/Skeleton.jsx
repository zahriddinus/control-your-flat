import "./skeleton.scss";
import { useI18n } from "../../i18n";

// Yaltiroq bo'sh blok: ma'lumot kelguncha shu joyda nima turishini ko'rsatadi
export const Skeleton = ({ width = "100%", height = 16, radius = 8, className = "" }) => (
  <span
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius: radius }}
    aria-hidden="true"
  ></span>
);

const Card = ({ height, children }) => (
  <div className="skeleton-card card border-0 shadow-sm h-100" style={{ minHeight: height }}>
    <div className="card-body d-flex flex-column gap-2">{children}</div>
  </div>
);

// Kichik kartochka: chapda doira, o'ngda ikki qator matn
const RowCard = () => (
  <Card>
    <div className="d-flex align-items-center gap-3">
      <Skeleton width={44} height={44} radius="50%" />
      <div className="flex-grow-1 d-flex flex-column gap-2">
        <Skeleton width="40%" height={12} />
        <Skeleton width="70%" height={16} />
      </div>
    </div>
  </Card>
);

const Title = ({ width = 220 }) => <Skeleton width={width} height={26} className="mb-3" />;

// Har bir sahifaning taxminiy ko'rinishi
const LAYOUTS = {
  home: () => (
    <>
      <Skeleton height={170} radius={16} className="mb-4" />
      <Skeleton height={150} radius={16} className="mb-4" />
      <Title />
      <div className="row g-3 mb-4">
        {[0, 1, 2].map((index) => (
          <div className="col-12 col-md-4" key={index}>
            <RowCard />
          </div>
        ))}
      </div>
      <div className="row g-3">
        {[0, 1].map((index) => (
          <div className="col-12 col-lg-6" key={index}>
            <Card height={180}>
              <Skeleton width="45%" height={20} />
              <Skeleton height={38} radius={10} />
              <Skeleton width="80%" />
              <Skeleton width="60%" />
            </Card>
          </div>
        ))}
      </div>
    </>
  ),

  users: () => (
    <>
      <div className="d-flex justify-content-between gap-3 mb-4">
        <Skeleton width={180} height={32} />
        <Skeleton width={260} height={38} radius={10} className="d-none d-md-block" />
      </div>
      <div className="row g-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="col-12 col-sm-6 col-lg-4" key={index}>
            <Card height={150}>
              <div className="d-flex align-items-center gap-3 mb-2">
                <Skeleton width={48} height={48} radius="50%" />
                <div className="flex-grow-1 d-flex flex-column gap-2">
                  <Skeleton width="75%" height={18} />
                  <Skeleton width="40%" height={12} />
                </div>
              </div>
              <div className="d-flex gap-2 mt-auto">
                <Skeleton height={30} radius={8} />
                <Skeleton height={30} radius={8} />
              </div>
            </Card>
          </div>
        ))}
      </div>
    </>
  ),

  schedule: () => (
    <>
      <div className="d-flex justify-content-between gap-3 mb-3">
        <Skeleton width={220} height={32} />
        <Skeleton width={160} height={32} radius={10} />
      </div>
      <Skeleton width={320} height={30} radius={10} className="mb-4" />
      <div className="row g-3 mb-4">
        {[0, 1, 2].map((index) => (
          <div className="col-12 col-md-4" key={index}>
            <RowCard />
          </div>
        ))}
      </div>
      {[0, 1].map((index) => (
        <div className="mb-4" key={index}>
          <Title />
          <Skeleton height={260} radius={12} />
        </div>
      ))}
    </>
  ),

  control: () => (
    <>
      <div className="d-flex justify-content-between gap-3 mb-4">
        <Skeleton width={220} height={40} />
        <Skeleton width={300} height={38} radius={10} className="d-none d-md-block" />
      </div>
      <div className="row g-3 mb-4">
        {[0, 1, 2, 3].map((index) => (
          <div className="col-6 col-lg-3" key={index}>
            <RowCard />
          </div>
        ))}
      </div>
      <Skeleton height={46} radius={12} className="mb-3" />
      <Skeleton height={340} radius={12} />
    </>
  ),
};

// Sahifa yuklanayotganda butun sahifa o'rniga uning "soyasi" ko'rinadi
export const PageSkeleton = ({ variant }) => {
  const { t } = useI18n();
  const Layout = LAYOUTS[variant];

  return (
    <div className="container py-3 py-md-4 text-start" role="status" aria-live="polite">
      <span className="visually-hidden">{t("common.loading")}</span>
      <Layout />
    </div>
  );
};
