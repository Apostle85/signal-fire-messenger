import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainApi from "../../utils/api/MainApi";
import { SUCCESS_REFRESH_MESSAGE } from "../../utils/constants";
import { CurrentUserContext, StrangersContext, SavedMoviesContext } from "../../utils/contexts";
import AuthForm from "../Authform/AuthForm";
import "./Profile.css";

export default function Profile(props) {
  const { currentUser, setCurrentUser } = useContext(CurrentUserContext);
  const { savedMovies, setSavedMovies } = useContext(SavedMoviesContext);
  const { strangers, setStrangers } = useContext(StrangersContext);
  const [isProfileValid, setIsProfileValid] = useState(false);
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
    MainApi.updateProfile(regData)
      .then(({ data }) => {
        setCurrentUser({ ...currentUser, name: data.name, email: data.email });
        setError({ isError: false, message: SUCCESS_REFRESH_MESSAGE });
      })
      .catch((err) => {
        const error = JSON.parse(err.message);
        setError({ isError: true, message: error.message });
        console.log(error.message);
      });
  };

  const handleSignOut = (e) => {
    setError({ isError: false, message: "" });
    MainApi.logout()
      .then(({ data }) => {
        localStorage.setItem("jwtoken", "");
        setCurrentUser({
          ...currentUser,
          isLogged: false,
          name: "",
          email: "",
          token: "",
        });
        setStrangers([]);
        setSavedMovies([]);
        localStorage.removeItem("exactMovies");
      })
      .catch((err) => {
        const error = JSON.parse(err.message);
        setError({ isError: true, message: error.message });
        console.log(error.message);
      });
  };

  useEffect(() => {
    if (!currentUser.isLogged) navigate("/");
  }, [currentUser.isLogged, navigate]);

  return (
    <main className="profile">
      <section className="profile__container">
        <h1 className="profile__title">Привет, {currentUser.name}!</h1>
        <AuthForm
          onError={error}
          userInfo={{ regData, setRegData }}
          valid={{ isValid: isProfileValid, setIsValid: setIsProfileValid }}
          type="profile"
          children={
            <button
              onClick={handleSubmit}
              disabled={!isProfileValid}
              className={`profile__button profile__button_type_change ${
                !isProfileValid && "profile__button_disabled"
              }`}
              type="submit"
            >
              Редактировать
            </button>
          }
        />
        <Link onClick={handleSignOut} className="profile__link" to="/signin">
          Выйти из аккаунта
        </Link>
      </section>
    </main>
  );
}
