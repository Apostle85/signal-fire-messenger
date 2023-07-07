import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../Authform/AuthForm";
import headerLogo from "../../images/header__logo.svg";
import "./Login.css";
import { useContext, useEffect, useState } from "react";
import MainApi from "../../utils/api/MainApi";
import { CurrentUserContext, SavedMoviesContext } from "../../utils/contexts";
import { VALIDATION_AUTH_ERR, VALIDATION_SERV_ERR } from "../../utils/constants";

export default function Login(props) {
  const { currentUser, setCurrentUser } = useContext(CurrentUserContext);
  const { savedMovies, setSavedMovies } = useContext(SavedMoviesContext);
  const [isLoginValid, setIsLoginValid] = useState(false);
  const navigate = useNavigate();
  const [regData, setRegData] = useState({});
  const [error, setError] = useState({
    isError: false,
    status: "",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError({ isError: false, message: "" });
    MainApi.login(regData)
      .then(({ data }) => {
        setCurrentUser((curUser) => ({
          ...curUser,
          isLogged: true,
          isLogging: true,
        }));
        return MainApi.getFriends();
      })
      .then(({ data: users }) => {
        setSavedMovies(users);
        return MainApi.getProfile();
      })
      .then(({ data }) => {
        const { email, name, _id, followers, followings, image} = data;
        setCurrentUser((curUser) => ({
          ...curUser,
          _id,
          name,
          email,
          image,
          followers,
          followings,
          isLogging: false,
        })); 
        navigate("/strangers");
      })
      .catch((err) => {
        // const error = JSON.parse(err.message);
        if (error.message)
          setError({
            isError: true,
            message:
              error.message === VALIDATION_SERV_ERR
                ? VALIDATION_AUTH_ERR
                : error.message,
          });
        console.log(err);
      });
  };
  
  return (
    <main className="login">
      <section className="login__container">
        <Link className="login__logo-link" to="/">
          <img
            src={headerLogo}
            className="login__logo"
            alt="Логотип Дипломного Проекта"
          />
        </Link>
        <h1 className="login__title">Рады видеть!</h1>
        <AuthForm
          onError={error}
          userInfo={{ regData, setRegData }}
          valid={{ isValid: isLoginValid, setIsValid: setIsLoginValid }}
          type="login"
        >
          <button
            onClick={handleSubmit}
            disabled={!isLoginValid}
            className={`login__button ${
              !isLoginValid && "login__button_disabled"
            }`}
            type="submit"
          >
            Войти
          </button>
        </AuthForm>
        <div className="login__link-container">
          <p className="login__link-title">Ещё не зарегистрированы?</p>
          <Link className="login__link" to="/signup">
            Регистрация
          </Link>
        </div>
      </section>
    </main>
  );
}
