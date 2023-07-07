import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { CurrentUserContext } from "../../utils/contexts";

const ProtectedRoute = ({ element: Component, ...props }) => {
  const { currentUser } = useContext(CurrentUserContext);
  return (
    <>
      {!currentUser.isLogging && (currentUser.isLogged ? (
        <Component {...props} />
      ) : (
        <Navigate to="/" replace />
      ))}
    </>
  );
};

export default ProtectedRoute;
