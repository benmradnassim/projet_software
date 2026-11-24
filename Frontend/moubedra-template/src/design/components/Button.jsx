import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Bouton / lien en forme de bouton.
 *   <Button variant="primary" icon={Heart}>Donner</Button>
 *   <Button to="/campagnes" variant="ghost" iconRight={ArrowRight} arrow>Voir</Button>
 * variant : primary | ghost | navy | soft | white | danger-soft | on-dark
 * size    : md (défaut) | sm | lg | wide
 * `to` -> <Link>, `href` -> <a>, sinon <button type="button">.
 * `loading` affiche un indicateur et `loadingText`.
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size,
    block,
    done,
    icon: IconCmp,
    iconRight: IconRight,
    iconSize,
    arrow,
    loading,
    loadingText,
    to,
    href,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const cls = ['btn', variant, size, block && 'block', done && 'done', className].filter(Boolean).join(' ');
  const s = iconSize || (size === 'sm' ? 15 : 18);
  const right = IconRight && <IconRight size={s} aria-hidden="true" />;
  const content = loading ? (
    <>
      <span className="spin2" aria-hidden="true" /> {loadingText || children}
    </>
  ) : (
    <>
      {IconCmp && <IconCmp size={s} aria-hidden="true" />}
      {children}
      {right && (arrow ? <span className="arr">{right}</span> : right)}
    </>
  );
  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={cls} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} type={type} className={cls} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
});

export default Button;
