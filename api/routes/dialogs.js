const router = require('express').Router();
const { Joi, celebrate } = require('celebrate');
// const regExHTTP = require('../constants/regularExpressions');

const { createDialog, removeDialog, getDialogs } = require('../controllers/dialogs');

router.get('/', getDialogs);
router.post('/', celebrate({
  body: Joi.object().keys({
    receiverId: Joi.string().required(),
  }),
}), createDialog);
router.delete('/', celebrate({
  body: Joi.object().keys({
    receiverId: Joi.string().required(),
  }),
}), removeDialog);

module.exports = router;
