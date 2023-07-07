import "./SearchForm.css";
import { CurrentUserContext, StrangersContext } from "../../utils/contexts";
import { searchMovies } from '../../utils/utils';
import { useContext, useEffect } from "react";
import {
  UNNAMED_API_ERR,
  NOT_FOUND_API_ERR,
  EMPTY_INPUT_ERR,
} from "../../utils/constants";
import MainApi from "../../utils/api/MainApi";

export default function SearchForm(props) {
  const { currentUser } = useContext(CurrentUserContext);
  const { setStrangers } = useContext(StrangersContext);
  const { input, setInput } = props.input;
  const { setIsLoading, setIsSubmit } = props;

  useEffect(() => {
    if (
      !props.saved &&
      localStorage.getItem("searchState")
    ) {
      const searchState = JSON.parse(localStorage.getItem("searchState"));
      setInput(searchState.input);
    }
    if (!props.saved && localStorage.getItem("strangers")) {
      setStrangers(JSON.parse(localStorage.getItem("strangers")));
    }
  }, [setInput, setStrangers, props.saved]);

  const handleSearchButtonClick = (e) => {
    const search = input;
    e.preventDefault();
    props.onError({ isError: false, message: "" });
    if (!props.saved) {
      localStorage.setItem("searchState", JSON.stringify({ input }));
    }
    if (search.length === 0) {
      props.onError({ isError: true, message: EMPTY_INPUT_ERR });
      return;
    }
    if (props.saved) {
      setIsSubmit(true);
    } else {
      // Getting Users for Strangers page
      MainApi.getUsers(input)
        .then((data) => {
          let { data: users } = data;
          users = users.filter(user => user._id !== currentUser._id);
          if (users.length === 0) {
            props.onError({ isError: true, message: NOT_FOUND_API_ERR });
            return;
          }
          localStorage.setItem("strangers", JSON.stringify(users));
          setStrangers(users);
          setIsLoading(false);
          setIsSubmit(true);
        })
        .catch((err) => {
          console.log(err);
          props.onError({
            isError: true,
            message: UNNAMED_API_ERR,
          });
        });
    }
  };

  return (
    <section className="search-form">
      <form className="search-form__form">
        <div className="search-form__search-container">
          <input
            required
            className="search-form__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Искать..."
          />
          <button
            onClick={handleSearchButtonClick}
            className="search-form__search-button"
            type="submit"
          >
            Найти
          </button>
        </div>
      </form>
    </section>
  );
}
