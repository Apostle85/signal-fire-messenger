import React, { useContext, useEffect, useState } from "react";
import MainApi from "../../utils/api/MainApi";
import { CurrentUserContext } from "../../utils/contexts";
import "./DialogElement.css";

const DialogElement = ({ friend }) => {
  return (
    <div className="conversation">
      <img
        className="conversationImg"
        // src={
        //   friend.profilePicture
        //     ? PF + friend.profilePicture
        //     : PF + "person/noAvatar.png"
        // }
        alt="АВАТАР"
      />
      <span className="conversationName">{friend.name}</span>
    </div>
  );
}
export default React.memo(DialogElement);