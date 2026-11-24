import { forwardRef, useId } from 'react';

/**
 * Champs de formulaire.
 *  - <Input label="Prénom" value onChange error hint />        champ standard (« inp3 »)
 *  - <Textarea label="Description" … />
 *  - <FloatingField label="Adresse e-mail" icon={Mail} … />     libellé flottant (connexion / inscription)
 * L'erreur est reliée au champ par aria-describedby + aria-invalid.
 */
export function Input({ label, error, hint, className = '', id: idProp, as: Tag = 'input', children, ...rest }) {
  const auto = useId();
  const id = idProp || auto;
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <>
      {label && (
        <label className="lbl" htmlFor={id}>
          {label}
        </label>
      )}
      <Tag
        id={id}
        className={`inp3${error ? ' bad' : ''} ${className}`}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {children}
      </Tag>
      {error ? (
        <small className="field-err" id={`${id}-err`} role="alert">
          {error}
        </small>
      ) : hint ? (
        <small className="field-hint" id={`${id}-hint`}>
          {hint}
        </small>
      ) : null}
    </>
  );
}

export function Textarea(props) {
  return <Input as="textarea" {...props} />;
}

export const FloatingField = forwardRef(function FloatingField(
  { label, icon: IconCmp, error, valid, right, className = '', id: idProp, as: Tag = 'input', children, shake, ...rest },
  ref,
) {
  const auto = useId();
  const id = idProp || auto;
  const cls = ['fld', !IconCmp && 'noicon', Tag === 'textarea' && 'ta', error && 'bad', valid && 'valid', shake && 'shake', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      <Tag ref={ref} id={id} placeholder=" " aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-err` : undefined} {...rest}>
        {children}
      </Tag>
      <label htmlFor={id}>{label}</label>
      {IconCmp && (
        <span className="ic" aria-hidden="true">
          <IconCmp size={18} />
        </span>
      )}
      {right}
      <small className="err" id={`${id}-err`} role={error ? 'alert' : undefined}>
        {error}
      </small>
    </div>
  );
});
