const Movie = require('../models/movie');

const NotFoundError = require('../errors/NotFoundError');
const IncorrectDataError = require('../errors/IncorrectDataError');
const NotEnoughRightsError = require('../errors/NotEnoughRightsError');

const {
  INCORRECT_CREATE_MOVIE_DATA_ERROR,
  MOVIE_NOT_FOUND_ERROR,
  NOT_ENOUGH_RIGHTS_TO_DELETE_MOVIE_ERROR,
  INCORRECT_DELETE_MOVIE_DATA_ERROR,
} = require('../constants/errorMessages');

module.exports.getMovies = (req, res, next) => {
  Movie.find({ owner: req.user._id })
    .then((movies) => {
      console.log(movies);
      res.send({ data: movies });
    })
    .catch(next);
};

module.exports.createMovie = (req, res, next) => {
  const {
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    nameRU,
    nameEN,
    thumbnail,
    movieId,
  } = req.body;

  Movie.create({
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    nameRU,
    nameEN,
    thumbnail,
    movieId,
    owner: req.user._id,
  })
    .then((movie) => res.send({ data: movie }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(
          new IncorrectDataError(
            INCORRECT_CREATE_MOVIE_DATA_ERROR,
          ),
        );
      }
      next(err);
    });
};

module.exports.deleteMovie = (req, res, next) => {
  const { movieId } = req.params;
  Movie.find({ movieId })
    .then((movies) => {
      if (!movies) throw new NotFoundError(MOVIE_NOT_FOUND_ERROR);
      console.log(movies);
      const checkMovies = Array.from(movies).filter((movie) => {
        console.log('USER id: ', req.user._id, '\nMOVIE owner: ', movie.owner);
        return req.user._id === movie.owner.toString();
      });

      if (checkMovies.length === 0) {
        throw new NotEnoughRightsError(NOT_ENOUGH_RIGHTS_TO_DELETE_MOVIE_ERROR);
      }
      return Movie.deleteOne({ _id: checkMovies[0] });
    })
    .then((newMovie) => {
      if (newMovie.deletedCount === 0) {
        throw new NotFoundError(MOVIE_NOT_FOUND_ERROR);
      }

      return res.send({ data: newMovie });
    })
    .catch((err) => {
      if (err.name === 'CastError') next(new IncorrectDataError(INCORRECT_DELETE_MOVIE_DATA_ERROR));
      next(err);
    });
};
