import SearchForm from "../SearchForm/SearchForm";
import StrangersCardList from "../StrangersCardList/StrangersCardList";
import Preloader from "../Preloader/Preloader";
import React, { useEffect } from "react";
import "./Strangers.css";

export default function Movies(props) {
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
        setIsSubmit={setIsSubmit}
        saved={false}
        onError={handleError}
        setIsLoading={setIsLoading}
        input={{ input, setInput }}
      />
      {isLoading ? (
        <Preloader />
      ) : error.isError ? (
        <p className="movies__error-message">{error.message}</p>
      ) : (
        <StrangersCardList onError={ setError } onSubmit={{isSubmit, setIsSubmit}} input={input} type={'strangers'} />
      )}
    </main>
  );
}
