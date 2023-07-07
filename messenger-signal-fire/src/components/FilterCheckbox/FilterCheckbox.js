import "./FilterCheckbox.css";

export default function FilterCheckbox(props) {
  return (
  <div className="filter-checkbox">
      <label htmlFor="input" className="filter-checkbox__container"></label>
        <input checked={props.isShortMovieChecked} onChange={props.onClick}  id="input" className="filter-checkbox__input" type="checkbox" />
      <div className="filter-checkbox__switch"></div></div>
  );
}
