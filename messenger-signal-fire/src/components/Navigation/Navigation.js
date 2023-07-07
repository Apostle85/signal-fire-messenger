import React, { useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { CurrentUserContext } from "../../utils/contexts";
import "./Navigation.css";

export default function Navigation(props) {
  const { currentUser } = useContext(CurrentUserContext);
  const location = useLocation();
  const [checked, setChecked] = React.useState(false);

  return (
    <nav className="navigation">
      {!currentUser.isLogged ? (
        <>
          <NavLink
            className="navigation__link navigation__link_type_register"
            to="/signup"
          >
            Регистрация
          </NavLink>
          <NavLink
            className="navigation__link navigation__link_type_login"
            to="/signin"
          >
            Войти
          </NavLink>
        </>
      ) : (
        <>
          <div
            className={`navigation__background ${
              checked && "navigation__background_active"
            }`}
          ></div>
          <input
            className="navigation__checkbox"
            value={checked}
            onChange={() => setChecked(!checked)}
            id="checkbox"
            type="checkbox"
          />
          <label className="navigation__button" htmlFor="checkbox">
            <span></span>
          </label>
          <div className="navigation__links">
            <div className="navigation__link-list">
              <NavLink
                className={({
                  isActive,
                }) => `navigation__link navigation__link_state_authorized navigation__link_type_movie
                ${isActive ? "navigation__link_active" : ""}`}
                to="/friends"
              >
                Друзья
              </NavLink>
              <NavLink
                className={({
                  isActive,
                }) => `navigation__link navigation__link_state_authorized navigation__link_type_movie
                ${isActive ? "navigation__link_active" : ""}`}
                to="/requests"
              >
                Заявки
              </NavLink>
              <NavLink
                className={({
                  isActive,
                }) => `navigation__link navigation__link_state_authorized navigation__link_type_movie
                ${isActive ? "navigation__link_active" : ""}`}
                to="/strangers"
              >
                Найти странников
              </NavLink>
              <NavLink
                className={({
                  isActive,
                }) => `navigation__link navigation__link_state_authorized navigation__link_type_saved-movie
                ${isActive ? "navigation__link_active" : ""}`}
                to="/"
              >
                О Костре
              </NavLink>
            </div>
            <NavLink className="account-button" to="/profile">
              <div className="navigation__logo"></div>
              <p className="navigation__link navigation__link_state_authorized navigation__link_type_account">
                Обо мне
              </p>
            </NavLink>
          </div>
        </>
      )}
    </nav>
  );
}
