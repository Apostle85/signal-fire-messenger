import React, { useEffect } from "react";
import "./Input.css";

export default function Input({ onChange, ...props}) {
  const { value, setValue } = props.input;

  function handleChange(e) {
    setValue(e.target.value);
    // props.onChange();
  }

  // useEffect(()=>{onChange();},[value,onChange])

  return (
    <input
      className={`input ${props.class}`}
      type={props.type}
      placeholder={props.placeholder}
      required={props.required}
      name={props.name}
      value={value}
      onChange={handleChange}
    />
  );
}
