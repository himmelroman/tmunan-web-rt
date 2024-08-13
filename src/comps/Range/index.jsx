/**
 *
 * Range
 *
 */
import PropTypes from 'prop-types'

import styles from './index.module.scss'

const Range = ({ name, label, value, onChange, min = 0, max = 100, step = 1 }) => {
	const onRangeChange = e => {
		onChange?.(e.target.value, name)
	}

	const onTextChange = e => {
		// limit to numbers and decimals
		if (!/^\d*\.?\d*$/.test(e.target.value)) return
		onChange?.(parseFloat(e.target.value), name)
	}

	return (
		<div id={`range-${name}`} className={styles.cont}>
			<div className={styles.row}>
				<label htmlFor={name}>{label || name}</label>
				<input name={`${name}-value`} type='text' className={styles.text} value={value} onChange={onTextChange} />
			</div>
			<input name={name} type='range' className={styles.range} value={value} min={min} max={max} step={step} onChange={onRangeChange} />
		</div>
	)
}

Range.propTypes = {
	name: PropTypes.string.isRequired,
	label: PropTypes.string,
	value: PropTypes.number.isRequired,
	onChange: PropTypes.func.isRequired,
	min: PropTypes.number,
	max: PropTypes.number,
	step: PropTypes.number,
}

export default Range
