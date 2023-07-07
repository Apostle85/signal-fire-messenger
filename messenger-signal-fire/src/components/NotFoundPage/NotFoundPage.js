import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import './NotFoundPage.css';

export default function NotFoundPage(props) {
  const navigate = useNavigate();
  useEffect(() => {
    props.onOpen();
    return props.onClose;
  }, []);

  return (
    <main className="not-found-page">
      <h1 className="not-found-page__title">404</h1>
      <p className="not-found-page__subtitle">Страница не найдена</p>
      <a onClick={()=>navigate(-1)} className="not-found-page__link" to="/">Назад</a>
    </main>
  );
}
