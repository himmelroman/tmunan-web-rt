/**
 *
 * Check
 *
 */
import { forwardRef } from 'react'
import PropTypes from 'prop-types'

import useClasses from '~/lib/useClasses'
import styles from './index.module.scss'
import { MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md'

const Check = forwardRef(
	(
		{
			name,
			onChange,
			value = false,
			className,
			children = (
				<>
					<MdCheckBox data-if-checked />
					<MdCheckBoxOutlineBlank data-if-unchecked />
				</>
			),
			...props
		},
		ref
	) => {
		const onClick = () => {
			onChange?.(!value, name)
		}

		const onKeyDown = e => {
			if (e.key === 'Enter' || e.key === ' ') {
				onClick()
			}
		}

		const cls = useClasses(styles.cont, className, value ? styles.checked : styles.unchecked)

		return (
			<button
				name={name}
				className={cls}
				{...props}
				ref={ref}
				data-check
				data-checked={value || null}
				onClick={onClick}
				onKeyDown={onKeyDown}
			>
				{children}
			</button>
		)
	}
)

Check.displayName = 'Check'

Check.propTypes = {
	name: PropTypes.string,
	onChange: PropTypes.func,
	value: PropTypes.bool.isRequired,
	className: PropTypes.string,
	children: PropTypes.node,
}

export default Check
