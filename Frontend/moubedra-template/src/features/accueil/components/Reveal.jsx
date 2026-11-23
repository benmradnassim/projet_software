import { useInView } from '../../../design/hooks';

/** Apparition au défilement (classe .reveal -> .vis), avec délai facultatif. */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, style, ...rest }) {
  const [ref, visible] = useInView({ threshold: 0.2 });
  return (
    <Tag ref={ref} className={`reveal${visible ? ' vis' : ''} ${className}`} style={{ transitionDelay: `${delay}s`, ...style }} {...rest}>
      {typeof children === 'function' ? children(visible) : children}
    </Tag>
  );
}
