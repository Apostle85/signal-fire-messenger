const router = require('express').Router();
const { Joi, celebrate } = require('celebrate');

// const upload = require('../middlewares/multer');
const { createMessage, getDialogMessages } = require('../controllers/messages');
// const regExHTTP = require('../constants/regularExpressions');

router.get('/:dialogId', celebrate({
  params: Joi.object().keys({
    dialogId: Joi.string().required(),
  }),
}), getDialogMessages);
// upload.single('image')
router.post('/', celebrate({
  body: Joi.object().keys({
    senderId: Joi.string().required(),
    dialogId: Joi.string().required(),
    text: Joi.string().required(),
  }),
}), createMessage);

// router.delete('/:movieId', celebrate({
//   params: Joi.object().keys({
//     movieId: Joi.number().required(),
//   }),
// }), deleteMovie);

module.exports = router;
