const router = require('express').Router();
const { Joi, celebrate } = require('celebrate');
// const upload = require('../middlewares/multer');

const {
  getUser,
  getUsers,
  getUserById,
  updateUser,
  followUser,
  unfollowUser,
  getFriends,
} = require('../controllers/users');
// upload.single('users')
router.get('/friends', getFriends);
router.get('/me', getUser);
router.patch('/me', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    name: Joi.string().required().min(2).max(30),
  }),
}), updateUser);
router.get('/:regexp', getUsers);
router.get('/user/:userId', celebrate({
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
}), getUserById);
router.put('/user/:userId/follow', followUser);
router.delete('/user/:userId/follow', unfollowUser);

module.exports = router;
