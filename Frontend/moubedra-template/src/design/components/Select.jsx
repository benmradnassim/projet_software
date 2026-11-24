import { useId } from 'react';

/**
 * Liste déroulante (« sel2 »).
 *   <Select label="Région" hideLabel value onChange options={['Sfax', …]} placeholder="Toutes les régions" />
 * options : chaînes ou { value, label }.
 */
export default function Select({ label, hideLabel, options = [], placeholder, size, className = '', id: idProp, ...rest }) {
  const auto = useId();
  const id = idProp || auto;
  return (
    <>
      {label && (
        <label className={hideLabel ? 'sr-only' : 'lbl'} htmlFor={id}>
          {label}
        </label>
      )}
      <select id={id} className={`sel2${size === 'sm' ? ' sm' : ''} ${className}`} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const { value, label: text } = typeof o === 'object' ? o : { value: o, label: o };
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </>
  );
}
