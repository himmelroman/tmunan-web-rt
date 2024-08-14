/**
 *
 * Range
 *
 */
import PropTypes from 'prop-types'

import styles from './index.module.scss'
import useDoubleClick from 'use-double-click'
import { useRef } from 'react'

const Range = ({ name, label, value, onChange, min = 0, max = 100, initial = 0, step = 1 }) => {
	const labelRef = useRef()

	useDoubleClick({
		onDoubleClick: e => {
			e.preventDefault()
			onChange?.(null, name)
		},
		ref: labelRef,
	})

	const onRangeChange = e => {
		const val = parseFloat(e.target.value)
		onChange?.(isNaN(val) ? initial : val, name)
	}

	const onTextChange = e => {
		// limit to numbers and decimals
		const val = parseFloat(e.target.value.replace(/[^0-9.]/g, ''))
		onChange?.(isNaN(val) ? initial : val, name)
	}

	const onKeyDown = e => {
		const { ctrlKey, key } = e
		if (key === 'ArrowUp') {
			onChange?.(Math.round((value + step * (ctrlKey ? 10 : 1)) * 100) / 100, name)
		} else if (key === 'ArrowDown') {
			onChange?.(Math.round((value - step * (ctrlKey ? 10 : 1)) * 100) / 100, name)
		}
	}

	return (
		<div id={name ? `range-${name}` : undefined} className={styles.cont} onKeyDown={onKeyDown}>
			<div className={styles.row}>
				<label ref={labelRef} htmlFor={name}>
					{label || name}
				</label>
				<input name={`${name}-value`} type='text' className={styles.text} value={value} onChange={onTextChange} />
			</div>
			<input name={name} type='range' className={styles.range} value={value} min={min} max={max} step={step} onChange={onRangeChange} tabIndex={-1} />
		</div>
	)
}

Range.propTypes = {
	name: PropTypes.string,
	label: PropTypes.string,
	value: PropTypes.number.isRequired,
	onChange: PropTypes.func,
	min: PropTypes.number,
	max: PropTypes.number,
	step: PropTypes.number,
	initial: PropTypes.number,
}

export default Range
