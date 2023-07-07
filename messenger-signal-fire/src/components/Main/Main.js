import Promo from "../Promo/Promo";
import Techs from "../Techs/Techs";
import AboutMe from "../AboutMe/AboutMe";
import Portfolio from "../Portfolio/Portfolio";

export default function Main(props) {
  return (
    <main className="main">
      <Promo />
      <Techs />
      <AboutMe />
      <Portfolio />
    </main>
  );
}
