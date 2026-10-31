import { Avatar } from "../../components/Avatar";

// Bugungi navbatchiga kichik minnatdorchilik
export const DayHero = ({ users, schedule }) => {
  const hero = users.find((user) => user.user_id === schedule?.duty?.user_id);

  if (!hero) return null;

  return (
    <section className="home__hero card border-0 shadow-sm mb-4">
      <div className="card-body d-flex align-items-center gap-3 text-start">
        <Avatar user={hero} size="lg" />

        <div className="overflow-hidden">
          <small className="text-muted d-block">Bugungi qahramon 🏆</small>

          <h3 className="home__hero-name fw-bold m-0 text-truncate">
            {hero.name} {hero.last_name}
          </h3>

          <span className="text-muted">Bugun uy tartibi uning qo'lida. Rahmat! 🙌</span>
        </div>
      </div>
    </section>
  );
};
