/**
 *
 * Button
 *
 */
import PropTypes from 'prop-types'
import styles from './index.module.scss'
import useClasses from '~/lib/useClasses'
import { forwardRef } from 'react'

const Button = forwardRef(({ icon, className, children, ...props }, ref) => {
	return (
		<button className={useClasses(styles.cont, className)} {...props} ref={ref}>
			{icon && <span className={`material-symbols-outlined ${styles.icon}`}>{icon}</span>}
			{children}
		</button>
	)
})

Button.displayName = 'Button'

Button.propTypes = {
	icon: PropTypes.string,
	className: PropTypes.string,
	children: PropTypes.node,
}

export default Button
