import "./AboutMe.css";
import aboutMePhoto from "../../images/about-me__photo.jpeg";

export default function AboutMe(props) {
  return (
    <section className="about-me">
      <h2 className="about-me__heading">Обо мне</h2>
      <div className="about-me__container">
        <div className="about-me__article">
          <h3 className="about-me__title">Илья</h3>
          <p className="about-me__subtitle">Студент Казанского Федерального Университета, 21 год</p>
          <p className="about-me__paragraph">
            Учусь в Казани, заканчиваю институт Вычислительной Математики и Информационных Технологий по направлению Информационной Безопасности. Я люблю слушать музыку и играю песни на гитаре и пианино.
            Хожу в церковь и читаю Библию. С 2019 года изучаю программирование на разных языках: Python, C# и JS.
          </p>
          <p className="about-me__ref">Github</p>
        </div>
        <img src={aboutMePhoto} alt="Мое фото" className="about-me__photo" />
      </div>
    </section>
  );
}
