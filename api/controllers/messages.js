const Message = require('../models/message');
// const NotFoundError = require('../errors/NotFoundError');
const IncorrectDataError = require('../errors/IncorrectDataError');
// const NotEnoughRightsError = require('../errors/NotEnoughRightsError');

const {
  INCORRECT_CREATE_DIALOG_DATA_ERROR,
} = require('../constants/errorMessages');
const { encryptAesGcm256 } = require('../utils/encrypting');
// const regExHTTP = require('../constants/regularExpressions');

module.exports.getDialogMessages = (req, res, next) => {
  const { dialogId } = req.params;

  Message.find({ dialogId })
    .then((messages) => {
      console.log(messages);
      return res.send({
        data: encryptAesGcm256(messages, req.user.serverKey),
      });
    })
    .catch(next);
};

module.exports.createMessage = (req, res, next) => {
  const {
    dialogId,
    senderId,
    text,
  } = req.body;
  Message.create({
    dialogId,
    senderId,
    text,
    // image: req.file.path,
  })
    .then((message) => res.send({
      data: encryptAesGcm256(message, req.user.serverKey),
    }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(
          new IncorrectDataError(
            INCORRECT_CREATE_DIALOG_DATA_ERROR,
          ),
        );
      }
      next(err);
    });
};

// module.exports.deleteMovie = (req, res, next) => {
//   const { movieId } = req.params;
//   Movie.find({ movieId })
//     .then((movies) => {
//       if (!movies) throw new NotFoundError(MOVIE_NOT_FOUND_ERROR);
//       console.log(movies);
//       const checkMovies = Array.from(movies).filter((movie) => {
//         console.log('USER id: ', req.user._id, '\nMOVIE owner: ', movie.owner);
//         return req.user._id === movie.owner.toString();
//       });

//       if (checkMovies.length === 0) {
//         throw new NotEnoughRightsError(NOT_ENOUGH_RIGHTS_TO_DELETE_MOVIE_ERROR);
//       }
//       return Movie.deleteOne({ _id: checkMovies[0] });
//     })
//     .then((newMovie) => {
//       if (newMovie.deletedCount === 0) {
//         throw new NotFoundError(MOVIE_NOT_FOUND_ERROR);
//       }

//       return res.send({ data: newMovie });
//     })
//     .catch((err) => {
//       if (err.name === 'CastError') {
//          next(new IncorrectDataError(INCORRECT_DELETE_MOVIE_DATA_ERROR));
//       }
//       next(err);
//     });
// };
