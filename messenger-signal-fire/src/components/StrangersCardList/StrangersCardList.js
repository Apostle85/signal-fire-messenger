import StrangersCard from "../StrangersCard/StrangersCard";
import "./StrangersCardList.css";
import { CurrentUserContext, SavedMoviesContext, StrangersContext } from "../../utils/contexts";
import { useState, useCallback, useContext, useEffect } from "react";
import {
  BIG_CLIENT_WIDTH,
  BIG_ELEMENT_WIDTH,
  BIG_ROW_INDEX,
  MEDIUM_ELEMENT_WIDTH,
  NOT_FOUND_API_ERR,
  SMALL_CLIENT_WIDTH,
  SMALL_ROW_INDEX,
  TINY_ELEMENT_WIDTH,
} from "../../utils/constants";
import { searchFriends } from "../../utils/utils";

export default function StrangersCardList({ type, reqs, onSubmit, onError, input }) {
  const { strangers } = useContext(StrangersContext);
  const { savedMovies } = useContext(SavedMoviesContext);
  const { currentUser } = useContext(CurrentUserContext);
  // savedMovies.filter(friend => currentUser.followers.includes(friend))
  const choosedMovies = type === 'friends' ? savedMovies : type === 'requests' ? reqs : strangers;
  const [exactMovies, setExactMovies] = useState(choosedMovies);
  const [rowIndex, setRowIndex] = useState(0);
  const { isSubmit, setIsSubmit } = onSubmit;

  const getRowElementsNumber = () => {
    let elementWidth = BIG_ELEMENT_WIDTH;
    if (document.documentElement.clientWidth > BIG_CLIENT_WIDTH)
      elementWidth = BIG_ELEMENT_WIDTH;
    else if (document.documentElement.clientWidth > SMALL_CLIENT_WIDTH)
      elementWidth = MEDIUM_ELEMENT_WIDTH;
    else elementWidth = TINY_ELEMENT_WIDTH;

    const grid = document.querySelector(".movies-card-list__cards");
    const gridWidth =
      grid.clientWidth - parseInt(window.getComputedStyle(grid).gap);
    return Math.floor(gridWidth / elementWidth);
  };
  
  useEffect(() => {
    if (type !== 'friends') {
      let number = getRowElementsNumber();
      if (document.documentElement.clientWidth > SMALL_CLIENT_WIDTH)
        setRowIndex(number * BIG_ROW_INDEX);
      else setRowIndex(number * SMALL_ROW_INDEX);
    }
  }, [isSubmit, type]);

  const listMovies = useCallback(
    (users) => {
      onError({ isError: false, status: "", message: "" });
      let moviesPart = users;
      if (type === 'friends') moviesPart = searchFriends(moviesPart, input);
      setIsSubmit(false);
      console.log('USERS:', moviesPart)
      if (type === 'strangers') {
        localStorage.setItem(
          "exactMovies",
          JSON.stringify({ exactMovies: moviesPart })
        );
      }
      if (moviesPart.length === 0)
        onError({
          isError: true,
          status: "",
          message: NOT_FOUND_API_ERR,
        });
      return moviesPart;
    },
    [setIsSubmit, type, onError, input]
  );

  useEffect(() => {
    if (type === 'strangers') {
      if (localStorage.getItem("exactMovies")) {
        const storageMovies = JSON.parse(
          localStorage.getItem("exactMovies")
        ).exactMovies;
        if (storageMovies !== [] && storageMovies !== undefined) {
          setExactMovies(storageMovies);
        }
      }
    } else {
      setExactMovies(choosedMovies);
    }
  }, [type, choosedMovies]);

  useEffect(() => {
    if (isSubmit) setExactMovies(listMovies(choosedMovies));
  }, [choosedMovies, isSubmit, type, listMovies]);

  const handleButtonClick = () => {
    let number = getRowElementsNumber();

    if (document.documentElement.clientWidth > 891)
      setRowIndex(rowIndex + number);
    else setRowIndex(rowIndex + 2 * number);
  };

  return (
    <section className="movies-card-list">
      <ul className="movies-card-list__cards">
        {((type === 'friends'
          ? exactMovies
          : exactMovies?.filter((user, index) => index < rowIndex)
        ) ?? []).map((user) => {
          return (
            <StrangersCard
              exactMovies={{ exactMovies, setExactMovies }}
              key={user._id}
              user={user}
              saved={type === 'friends'}
            />
          );
        })}
      </ul>
      {exactMovies?.length > rowIndex &&
        type !== 'friends' && (
          <button
            onClick={handleButtonClick}
            className="movies-card-list__button"
          >
            Ещё
          </button>
        )}
    </section>
  );
}
