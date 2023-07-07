const router = require('express').Router();

const messageRouter = require('./messages');
const dialogRouter = require('./dialogs');
const userRouter = require('./users');
const movieRouter = require('./movies');
const {
  signUp,
  signIn,
  signInProof,
} = require('../controllers/users');
const auth = require('../middlewares/auth');
const {
  validateSignIn,
  validateSignUp,
  validateSignInProof,
} = require('../middlewares/validations');
const NotFoundError = require('../errors/NotFoundError');
const { UNKNOWN_RESOURCE_ERROR } = require('../constants/errorMessages');
const { SIGNOUT_MESSAGE } = require('../constants/successMessages');

const { NODE_ENV } = process.env;

// router.post('/signup', validateSignUp, signUp);
router.post('/signup', signUp);
router.post('/signin/proof', validateSignInProof, signInProof);
router.post('/signin', validateSignIn, signIn);
router.use(auth);
// router.post('/test', test);

router.get('/signout', (req, res) => res
  .clearCookie('jwt', {
    domain:
      NODE_ENV === 'production'
        ? 'eliproject.students.nomoredomains.rocks'
        : 'localhost',
  })
  .send({ message: SIGNOUT_MESSAGE }));

router.use('/messages', messageRouter);
router.use('/dialogs', dialogRouter);
router.use('/users', userRouter);
router.use('/movies', movieRouter);
router.use('/', (req, res, next) => next(
  new NotFoundError(UNKNOWN_RESOURCE_ERROR),
));

module.exports = router;
