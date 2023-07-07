export const searchFriends = (movies, input) =>
  movies.filter(
    (movie) =>
      (new RegExp(input, "i")).exec(movie.name) ||
      new RegExp(input, "i").exec(movie.email)
  );

export const getShortMovieTime = (duration) => `${Math.floor(duration/60)}ч${duration%60}м`;