import './header.scss';
import { Link, NavLink } from 'react-router-dom';

export const Header = () => {
  return (
    <header>
      <div className="container py-2 d-flex justify-content-between">
        <Link className="text-decoration-none fw-semibold" to="/">
          Residents
        </Link>

        <nav>
          <ul className="m-0 p-0 list-unstyled d-flex ">
            <li className="header__nav-item me-3">
              <NavLink to="/" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                Home
              </NavLink>
            </li>
            <li className="header__nav-item ">
              <NavLink to="/users" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                Users
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
