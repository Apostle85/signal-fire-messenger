import promoPicture from "../../images/header__logo.svg";
import "./Promo.css";

export default function Promo(props) {
  return (
    <section className="promo">
      <div className="promo__container">
        <h1 className="promo__title">
          Приходи на Костер. Посидим, поболтаем.
        </h1>
        <p className="promo__subtitle">
          Листайте ниже, чтобы узнать больше про этот проект и его создателя.
        </p>
        <a className="promo__anchor nav-button" href="#techs">Узнать больше
        </a>
      </div>
      <img
        className="promo__picture"
        src={promoPicture}
        alt="Планета, выложенная словами 'WEB'"
      ></img>
    </section>
  );
}
