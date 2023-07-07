import { useCallback, useContext, useEffect, useState } from "react";
import Input from "../Input/Input";
import "./AuthForm.css";
import {
  REQUIRED_PROFILE_INPUT_ERR,
  REQUIRED_INPUT_ERR,
  EMAIL_INPUT_ERR,
  NAME_INPUT_ERR,
} from "../../utils/constants";
import { CurrentUserContext } from "../../utils/contexts";

export default function AuthForm({ userInfo, type, valid, children, onError }) {
  const { currentUser } = useContext(CurrentUserContext);
  const { isValid, setIsValid } = valid;
  const { regData, setRegData } = userInfo;

  const [name, setName] = useState(type === "profile" ? currentUser.name : "");
  const [email, setEmail] = useState(
    type === "profile" ? currentUser.email : ""
  );
  const [password, setPassword] = useState("");

  const validateEmail = (email) => {
    const validEmail = new RegExp(
      /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
    );
    // console.log("validEmail:", validEmail.test(email) && email !== "");
    return validEmail.test(email) && email !== "";
  };

  const validateName = (name) => {
    const validName = new RegExp(/^[А-ЯA-ZËёh -]+$/imu);
    // console.log("validName: ", validName.test(name) && name !== "");
    return validName.test(name) && name !== "";
  };

  const validatePassword = (password) => {
    return password !== "";
  }

  const changeRegData = useCallback(() => {
    setRegData({ name, email, password });
  }, [setRegData, name, email, password]);

  const validateForm = useCallback(() => {
    return (
      validateEmail(email) &&
      (type !== "login" ? validateName(name) : true) &&
      (type === "profile"
        ? currentUser.name !== name || currentUser.email !== email
        : validatePassword(password))
    );
  }, [currentUser.name, currentUser.email, email, name, password, type]);

  // Заменить на useMemo?
  useEffect(() => {
    // console.log("isValid:", validateForm());
    setIsValid(validateForm());
    changeRegData();
  }, [name, email, validateForm, setIsValid, changeRegData]);

  return (
    <form
      onBlur={() => {
        setIsValid(validateForm());
      }}
      noValidate
      className="auth-form"
    >
      {type !== "login" && (
        <label
          className={`auth-form__label ${
            type === "profile" && "auth-form__label_form_profile"
          }`}
        >
          Имя
          <Input
            input={{
              value: name,
              setValue: setName,
            }}
            name="name"
            type="text"
            required
            class={`auth-form__input ${
              type === "profile" && "auth-form__input_form_profile"
            } auth-form__input_type_name`}
          />
          {type !== "profile" && (
            <span className={`auth-form__input-error`}>
              {name === ""
                ? REQUIRED_INPUT_ERR
                : !validateName(name)
                ? NAME_INPUT_ERR
                : ""}
            </span>
          )}
        </label>
      )}
      <label
        className={`auth-form__label ${
          type === "profile" && "auth-form__label_form_profile"
        }`}
      >
        E-mail
        <Input
          input={{
            value: email,
            setValue: setEmail,
          }}
          name="email"
          type="email"
          required
          class={`auth-form__input ${
            type === "profile" && "auth-form__input_form_profile"
          } auth-form__input_type_email`}
        />
        {type !== "profile" && (
          <span className={`auth-form__input-error`}>
            {email === ""
              ? REQUIRED_INPUT_ERR
              : !validateEmail(email)
              ? EMAIL_INPUT_ERR
              : ""}
          </span>
        )}
      </label>
      {type !== "profile" && (
        <label
          className={`auth-form__label ${
            type === "profile" && "auth-form__label_form_profile"
          }`}
        >
          Пароль
          <Input
            input={{
              value: password,
              setValue: setPassword,
            }}
            name="password"
            type="password"
            required
            class={`auth-form__input ${
              type === "profile" && "auth-form__input_form_profile"
            } auth-form__input_type_password`}
          />
          {type !== "profile" && (
            <span className={`auth-form__input-error`}>
              {password === "" ? REQUIRED_INPUT_ERR : ""}
            </span>
          )}
        </label>
      )}
      {type === "profile" && (
        <span className={`auth-form__input-error profile__error ${!onError.isError && 'profile__error_type_correct'}`}>
          {name === "" || email === ""
            ? REQUIRED_PROFILE_INPUT_ERR
            : !validateName(name)
            ? NAME_INPUT_ERR
            : !validateEmail(email)
            ? EMAIL_INPUT_ERR
            : onError.message}
        </span>
      )}
      {type !== "profile" && (
        <span className="`auth-form__input-error profile__error">
          {onError.isError ? onError.message : ""}
        </span>
      )}
      {children}
    </form>
  );
}
