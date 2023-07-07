import "./Portfolio.css";

export default function Portfolio(props) {
  return (
    <section className="portfolio">
      <h2 className="portfolio__heading">Портфолио</h2>
      <ul className="portfolio__list">
        <li className="portfolio__element">
          <a className="portfolio__ref" href="https://github.com/Apostle85/how-to-learn" target="_blank">
            <h3 className="portfolio__title">Статичный сайт</h3>
            <div className="portfolio__ref-logo"></div>
          </a>
        </li>
        <li className="portfolio__element">
          <a
            href="https://github.com/Apostle85/russian-travel"
            className="portfolio__ref"
            target="_blank"
          >
            <h3 className="portfolio__title">Адаптивный сайт</h3>
            <div className="portfolio__ref-logo"></div>
          </a>
        </li>
        <li className="portfolio__element">
          <a
            href="https://github.com/Apostle85/react-mesto-api-full"
            className="portfolio__ref"
            target="_blank"
          >
            <h3 className="portfolio__title">Одностраничное приложение</h3>
            <div className="portfolio__ref-logo"></div>
          </a>
        </li>
      </ul>
    </section>
  );
}
