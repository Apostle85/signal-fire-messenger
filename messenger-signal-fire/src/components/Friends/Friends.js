import StrangersCardList from "../StrangersCardList/StrangersCardList";
import Preloader from "../Preloader/Preloader";
import React, { useEffect } from "react";
import "./Friends.css";
import SearchForm from "../SearchForm/SearchForm";



export default function Friends(props) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmit, setIsSubmit] = React.useState(false);
  const [error, setError] = React.useState({
    isError: false,
    status: "",
    message: "",
  });
  const [input, setInput] = React.useState("");


  const handleError = (err) => {
    setError({
      isError: err.isError,
      status: err.status || error.status,
      message: err.message || error.message,
    });
  };

  return (
    <main className="movies">
      <SearchForm
        saved={true}
        setIsSubmit={setIsSubmit}
        onError={handleError}
        setIsLoading={setIsLoading}
        input={{ input, setInput }}
      />
      {isLoading ? (
        <Preloader />
      ) : error.isError ? (
        <p className="movies__error-message">{error.message}</p>
      ) : (
        <StrangersCardList
          onError={ setError }
          onSubmit={{ isSubmit, setIsSubmit }}
          input={input}
          type={'friends'}
        />
      )}
    </main>
  );
}
