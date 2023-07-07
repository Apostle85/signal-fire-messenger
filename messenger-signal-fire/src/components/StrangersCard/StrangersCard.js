import { memo, useContext, useState } from "react";
import "./StrangersCard.css";
import {
  CurrentUserContext,
  SavedMoviesContext,
  DialogContext,
} from "../../utils/contexts";
import MainApi from "../../utils/api/MainApi";

const StrangersCard = (props) => {
  const { _id, name, email, image } = props.user;
  const { currentUser, setCurrentUser } = useContext(CurrentUserContext);
  const { conversations, setConversations } = useContext(DialogContext);
  const { exactMovies, setExactMovies } = props.exactMovies;
  const { savedMovies, setSavedMovies } = useContext(SavedMoviesContext);
  const [isClicked, setIsClicked] = useState(
    props.saved
      ? true
      : savedMovies.some((user) => _id === user._id)
      ? true
      : false
  );
  const [isWait, setIsWait] = useState(false);

  const handleSaveButtonClick = (e) => {
    console.log("SAVED_USERS:", savedMovies);
    e.preventDefault();
    if(isWait) return;
    setIsWait(true);
    if (isClicked) {
      MainApi.unfollowUser(_id)
        .then((user) => {
          console.log("DELETED");
          setSavedMovies(savedMovies.filter((user) => _id !== user._id));
          setIsClicked(prev => !prev);
          setIsWait(false);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      MainApi.followUser(_id)
        .then(({ data: user }) => {
          console.log(user);
          setIsClicked(prev => !prev);
          setSavedMovies((users) => [...users, user]);
          if (!conversations.some((c) => c.members.includes(_id))) {
            return MainApi.createDialog(
              {
                receiverId: _id,
              },
            ).then(({ data: dialog }) => {
              setIsWait(false);
              console.log("CREATED_DIALOG: ", dialog);
            });
          }
        })

        .catch((err) => {
          console.log(err);
        });
    }
  };

  const handleRemoveButtonClick = () => {
    console.log(_id);
    MainApi.unfollowUser(_id)
      .then((user) => {
        setExactMovies(exactMovies.filter((user) => _id !== user._id));
        setSavedMovies(savedMovies.filter((user) => _id !== user._id));
        setIsClicked(false);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <li className="movies-card">
      <div className="movies-card__container">
        <div className="movies-card__info">
          <h2 className="movies-card__title">{name}</h2>
          <p className="movies-card__duration">{email}</p>
        </div>
        {_id !== currentUser._id &&
          (props.saved ? (
            <button
              onClick={handleRemoveButtonClick}
              className={`movies-card__save-button ${
                isClicked
                  ? "movies-card__save-button_state_saved"
                  : "movies-card__save-button_state_disabled"
              }`}
            ></button>
          ) : (
            <button
              onClick={handleSaveButtonClick}
              className={`movies-card__save-button ${
                isClicked && "movies-card__save-button_state_active"
              }`}
            ></button>
          ))}
      </div>
      {/* <a href={trailerLink} target="_blank" className="movies-card__link"> */}
      <img
        // src={`${props.saved ? image : MOVIES_API_URL + image.url}`}
        src = {image}
        alt={name}
        className="movies-card__image"
      />
      {/* </a> */}
    </li>
  );
}
export default memo(StrangersCard);