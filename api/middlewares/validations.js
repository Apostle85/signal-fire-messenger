const { celebrate, Joi } = require('celebrate');

const validateSignIn = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
});

const validateSignInProof = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    clientProof: Joi.string().required(),
    clientEphemeral: Joi.string().required(),
  }),
});

const validateSignUp = celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    verifier: Joi.string().required(),
    salt: Joi.string().required(),
    name: Joi.string().min(2).max(30),
    bundle: Joi.object().keys({
      IPK: Joi.object().keys({
        signing: Joi.any(),
        deriving: Joi.any(),
      }),
      SPK: Joi.any(),
      SPKSignature: Joi.any(),
      IPKSignature: Joi.any(),
    }),
  }),
});

module.exports = {
  validateSignUp,
  validateSignIn,
  validateSignInProof,
};
