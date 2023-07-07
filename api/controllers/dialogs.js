const Dialog = require('../models/dialog');

// const NotFoundError = require('../errors/NotFoundError');
const IncorrectDataError = require('../errors/IncorrectDataError');
// const NotEnoughRightsError = require('../errors/NotEnoughRightsError');

const {
  INCORRECT_CREATE_DIALOG_DATA_ERROR,
} = require('../constants/errorMessages');
const { encryptAesGcm256 } = require('../utils/encrypting');
// const regExHTTP = require('../constants/regularExpressions');

module.exports.getDialogs = (req, res, next) => {
  Dialog.find({ members: { $in: [req.user._id.toString()] } })
    .then((dialogs) => {
      console.log('Dialogs: ', dialogs);
      return res.send({
        data: encryptAesGcm256(dialogs, req.user.serverKey),
      });
    })
    .catch(next);
};

module.exports.createDialog = (req, res, next) => {
  const {
    receiverId,
  } = req.body;
  console.log([req.user._id.toString(), receiverId]);
  Dialog.findOne({ members: { $all: [req.user._id.toString(), receiverId] } })
    .then((dialog) => {
      console.log('DIALOG:ALREADY_EXISTS:', dialog);
      if (dialog) {
        return res.send({
          data: encryptAesGcm256(
            { message: 'Dialog already exists', dialog },
            req.user.serverKey,
          ),
        });
      }
      return Dialog.create({ members: [req.user._id.toString(), receiverId] })
        .then((newDialog) => res.send({
          data: encryptAesGcm256(newDialog, req.user.serverKey),
        }));
    })
    .catch((err) => {
      console.log(err);
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

module.exports.removeDialog = (req, res, next) => {
  const {
    receiverId,
  } = req.body;
  Dialog.deleteOne({
    members: [req.user._id.toString(), receiverId],
  })
    .then((dialogue) => res.send({
      data: encryptAesGcm256(dialogue, req.user.serverKey),
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
