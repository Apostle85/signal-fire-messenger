const jwt = require('jsonwebtoken');
const { createSRPServer } = require('@swan-io/srp');

const User = require('../models/user');
const NotFoundError = require('../errors/NotFoundError');
const IncorrectDataError = require('../errors/IncorrectDataError');
const ExistingEmailError = require('../errors/ExistingEmailError');
const IncorrectProfileError = require('../errors/IncorrectProfileError');

const server = createSRPServer('SHA-256', 2048);

const {
  EMAIL_IS_ALREADY_EXISTS_ERROR,
  USER_NOT_FOUND_ERROR,
  INCORRECT_CREATE_USER_DATA_ERROR,
  INCORRECT_UPDATE_USER_DATA_ERROR,
  INCORRECT_PROFILE_DATA_ERROR,
} = require('../constants/errorMessages');
const { encryptAesGcm256 } = require('../utils/encrypting');

// const {
//   AUTH_CORRECT_MESSAGE,
// } = require('../constants/successMessages');
module.exports.getUsers = (req, res, next) => {
  const { regexp } = req.params;
  User.find({
    $or: [{ name: { $regex: regexp } }, { email: { $regex: regexp } }],
  })
    .then((users) => {
      if (!users) {
        throw new NotFoundError(USER_NOT_FOUND_ERROR);
      }
      return res.send({
        data: encryptAesGcm256(users, req.user.serverKey),
      });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new IncorrectDataError(USER_NOT_FOUND_ERROR));
      }
      next(err);
    });
};

module.exports.getUser = (req, res, next) => {
  try {
    const {
      _id,
      email,
      name,
      followers,
      followings,
    } = req.user;
    const cipher = encryptAesGcm256(
      {
        _id,
        email,
        name,
        followers,
        followings,
      },
      req.user.serverKey,
    );
    return res.send({ data: cipher });
  } catch (err) {
    next(err);
  }
};

module.exports.getUserById = (req, res, next) => {
  const { userId } = req.params;
  User.findOne({ _id: userId })
    .then((user) => {
      if (!user) {
        throw new NotFoundError(USER_NOT_FOUND_ERROR);
      }
      return res.send({
        data: encryptAesGcm256(user, req.user.serverKey),
      });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new IncorrectDataError(USER_NOT_FOUND_ERROR));
      }
      next(err);
    });
};

module.exports.updateUser = (req, res, next) => {
  const { email, name, image } = req.body;

  User.findByIdAndUpdate(
    req.user._id,
    { email, name, image },
    {
      new: true,
      runValidators: true,
    },
  )
    .then((newUser) => {
      if (!newUser) {
        throw new NotFoundError(USER_NOT_FOUND_ERROR);
      }
      console.log('DATA:', newUser);
      const packedData = {
        data: encryptAesGcm256(newUser, req.user.serverKey),
      };
      console.log('Encrypted:', packedData.data);
      console.log('Packed:', packedData);
      return res.send(packedData);
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new IncorrectDataError(INCORRECT_UPDATE_USER_DATA_ERROR));
      }
      if (err.name === 'ValidationError') {
        next(new IncorrectDataError(INCORRECT_UPDATE_USER_DATA_ERROR));
      }
      next(err);
    });
};

// get friends
module.exports.getFriends = (req, res, next) => {
  // Promise.all(
  //   req.user.followers.filter((id) => req.user.followings.includes(id))
  //     .map((friendId) => User.findById(friendId)),
  // )
  Promise.all(
    req.user.followings.map((friendId) => User.findById(friendId)),
  )
    .then((friends) => {
      const friendList = [];
      friends.forEach(({
        _id,
        name,
        email,
        image,
      }) => friendList.push({
        _id,
        name,
        email,
        image,
      }));
      const cipher = encryptAesGcm256(friendList, req.user.serverKey);
      return res.send({ data: cipher });
    })
    .catch(next);
};

// follow a user

module.exports.followUser = async (req, res, next) => {
  if (req.user._id !== req.params.userId) {
    try {
      let user = await User.findById(req.params.userId);
      if (!user.followers.includes(req.user._id)) {
        user = await User
          .findByIdAndUpdate(
            req.params.userId,
            { $push: { followers: req.user._id } },
            { new: true, runValidators: true },
          ).select('+bundle');
        await User.findByIdAndUpdate(
          req.user._id,
          {
            $push: { followings: req.params.userId },
          },
        );
        res.status(200).json({
          data: encryptAesGcm256(user, req.user.serverKey),
        });
      } else {
        res.status(403).json('you already follow this user');
      }
    } catch (err) {
      next(err);
    }
  } else {
    res.status(403).json('you cant follow yourself');
  }
};

// unfollow a user
module.exports.unfollowUser = async (req, res, next) => {
  if (req.user._id !== req.params.userId) {
    try {
      const user = await User.findById(req.params.userId);
      const currentUser = await User.findById(req.user._id);
      if (user.followers.includes(req.user._id)) {
        await user.updateOne({ $pull: { followers: req.user._id } });
        await currentUser.updateOne({
          $pull: { followings: req.params.userId },
        });
        res.status(200).json({
          data: encryptAesGcm256(user, req.user.serverKey),
        });
      } else {
        res.status(403).json('you dont follow this user');
      }
    } catch (err) {
      next(err);
    }
  } else {
    res.status(403).json('you cant unfollow yourself');
  }
};

module.exports.signUp = (req, res, next) => {
  const {
    email,
    salt,
    verifier,
    name,
    bundle,
    image,
  } = req.body;
  console.log('BEFORE_REGISTER: ', {
    email,
    salt,
    verifier,
    name,
    bundle,
  });
  User.create({
    email,
    salt,
    verifier,
    name,
    bundle,
    image,
  })
    .then((user) => {
      console.log('user:', user);
      return res.send({
        data: user,
      });
    })
    .catch((err) => {
      if (err.code === 11000) next(new ExistingEmailError(EMAIL_IS_ALREADY_EXISTS_ERROR));
      if (err.name === 'ValidationError') next(new IncorrectDataError(INCORRECT_CREATE_USER_DATA_ERROR));
      next(err);
    });
};

module.exports.signIn = (req, res, next) => {
  const { email } = req.body;
  User
    // .findUserByCredentials(req.body.email, req.body.password)
    .findOne({ email })
    .select('+salt')
    .select('+verifier')
    .then((user) => {
      if (!user) {
        throw new IncorrectProfileError(INCORRECT_PROFILE_DATA_ERROR);
      }
      return server.generateEphemeral(user.verifier);
    })
    .then((key) => User.findOneAndUpdate({ email }, { serverKey: key }, { new: true }).select('+serverKey').select('+salt'))
    .then((user) => res.send({ data: { salt: user.salt, serverKey: user.serverKey.public } }))
    .catch(next);
};

module.exports.signInProof = (req, res, next) => {
  const { email, clientProof, clientEphemeral } = req.body;
  console.log('SIGN_IN_PROOF');
  User
    // .findUserByCredentials(req.body.email, req.body.password)
    .findOne({ email })
    .select('+salt')
    .select('+verifier')
    .select('+serverKey')
    .then(async (user) => {
      if (!user) {
        throw new IncorrectProfileError(INCORRECT_PROFILE_DATA_ERROR);
      }
      console.log('USER: ', user);
      if (user.serverKey.public === undefined) {
        throw new Error('SIGN_IN_ERROR: First make a request to signin endpoint');
      }
      const serverSession = await server.deriveSession(
        user.serverKey.secret,
        clientEphemeral,
        user.salt,
        '',
        user.verifier,
        clientProof,
      );
      console.log('SRP:Shared Key:', serverSession.key);
      console.log('UPDATED_PROOFED_USER:', await User.findOneAndUpdate({ email }, { serverKey: serverSession.key }, { new: true }).select('+serverKey').select('+bundle'));

      const { NODE_ENV, JWT_SECRET } = process.env;
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : 'some-secret-key',
        { expiresIn: '7d' },
      );
      res
        .cookie('jwt', token, {
          maxAge: 3600000,
          httpOnly: true,
          sameSite: true,
          domain: NODE_ENV === 'production' ? 'eliproject.students.nomoredomains.rocks' : 'localhost',
        });
      return res.send({ data: { _id: user._id, serverProof: serverSession.proof } });
      // return res.send({ data: AUTH_CORRECT_MESSAGE });
    })
    .catch(next);
// throw new IncorrectProfileError(INCORRECT_PROFILE_DATA_ERROR);
};
