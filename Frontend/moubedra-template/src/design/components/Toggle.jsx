/**
 * Interrupteur on/off (role="switch").
 *   <Toggle checked={fee} onChange={setFee}>Ajouter 4 % pour couvrir les frais</Toggle>
 */
export default function Toggle({ checked, onChange, children, className = '', ...rest }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} className={`tg2 ${className}`} onClick={() => onChange?.(!checked)} {...rest}>
      <span className="sw2" aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}
