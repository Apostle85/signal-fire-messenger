// Dialogs controller error messages
const INCORRECT_CREATE_DIALOG_DATA_ERROR = 'Введены некорректные данные для создания диалога';

// Movies controller error messages
const INCORRECT_CREATE_MOVIE_DATA_ERROR = 'Введены некорректные данные для создания фильма';
const MOVIE_NOT_FOUND_ERROR = 'Запрашиваемый фильм не найден';
const NOT_ENOUGH_RIGHTS_TO_DELETE_MOVIE_ERROR = 'Недостаточно прав для удаления фильма';
const INCORRECT_DELETE_MOVIE_DATA_ERROR = 'Введены некорректные данные для удаления фильма';

// Users controller error messages
const EMAIL_IS_ALREADY_EXISTS_ERROR = 'Почта уже занята';
const USER_NOT_FOUND_ERROR = 'Запрашиваемый пользователь не найден';
const INCORRECT_CREATE_USER_DATA_ERROR = 'Введены некорректные данные для создания пользователя';
const INCORRECT_UPDATE_USER_DATA_ERROR = 'Введены некорректные данные для обновления пользователя';
const INCORRECT_PROFILE_DATA_ERROR = 'Неправильные почта или пароль';

// Auth error messages
const UNAUTHORIZED_USER_ERROR = 'Необходима авторизация';
const INCORRECT_TOKEN_ERROR = 'Передан неверный токен';

// Unknown resource error message
const UNKNOWN_RESOURCE_ERROR = 'Запрашиваемый ресурс не найден';

// Unknown error message
const UNKNOWN_ERROR = 'На сервере произошла ошибка';

module.exports = {
  INCORRECT_CREATE_DIALOG_DATA_ERROR,
  INCORRECT_CREATE_MOVIE_DATA_ERROR,
  MOVIE_NOT_FOUND_ERROR,
  NOT_ENOUGH_RIGHTS_TO_DELETE_MOVIE_ERROR,
  INCORRECT_DELETE_MOVIE_DATA_ERROR,
  EMAIL_IS_ALREADY_EXISTS_ERROR,
  USER_NOT_FOUND_ERROR,
  INCORRECT_CREATE_USER_DATA_ERROR,
  INCORRECT_UPDATE_USER_DATA_ERROR,
  INCORRECT_PROFILE_DATA_ERROR,
  UNKNOWN_ERROR,
  UNAUTHORIZED_USER_ERROR,
  INCORRECT_TOKEN_ERROR,
  UNKNOWN_RESOURCE_ERROR,
};
