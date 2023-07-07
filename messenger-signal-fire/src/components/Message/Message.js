import "./Message.css";
import { format } from "timeago.js";
import logo from '../../images/header__logo.svg';
export default function Message({ message, own, image }) {
  return (
    <div className={own ? "message own" : "message"}>
      <div className="messageTop">
        <img
          className="messageImg"
          src={image || logo}
          alt='@'
        />
        <p className="messageText">{message.text}</p>
      </div>
      <div className="messageBottom">{format(message.createdAt)}</div>
    </div>
  );
}
