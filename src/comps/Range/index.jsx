/**
 *
 * Range
 *
 */
import PropTypes from 'prop-types'

import styles from './index.module.scss'
import { useMemo, useRef } from 'react'

const Range = ({
	name,
	label,
	value: outerValue,
	onChange,
	min = 0,
	max = 100,
	initial = 0,
	step = 1,
	natural_step,
	disabled,
	children,
	active,
}) => {
	const labelRef = useRef()
	const numRef = useRef()

	if (!natural_step) natural_step = step

	const value = useMemo(() => {
		if (outerValue || outerValue === 0) return outerValue
		return initial
	})

	const onRangeChange = e => {
		const val = parseFloat(e.target.value)
		onChange?.(isNaN(val) ? initial : val, name)
	}

	const onTextChange = e => {
		let val = e.target.value
		if (val.endsWith('.')) return

		if (val === '') val = initial
		else {
			val = parseFloat(val)
			if (isNaN(val)) val = initial
			else val = Math.min(Math.max(val, min), max)
		}

		if (val !== value) onChange?.(val, name)
	}

	const onDoubleClick = e => {
		e.preventDefault()
		onChange?.(initial, name)
	}

	const onKeyDown = e => {
		const { ctrlKey, altKey, key } = e
		if (
			!ctrlKey &&
			e.target.tagName === 'INPUT' &&
			!/(\.|Tab|\d|Enter|Escape|Backspace|Delete|ArrowLeft|ArrowRight)/.test(key)
		) {
			e.preventDefault()
		}
		let val = value
		if (key === 'ArrowUp') {
			val = Math.min(
				Math.max(Math.round((value + natural_step * (ctrlKey ? 10 : altKey ? 0.1 : 1)) * 100) / 100, min),
				max
			)
		} else if (key === 'ArrowDown') {
			val = Math.min(
				Math.max(Math.round((value - natural_step * (ctrlKey ? 10 : altKey ? 0.1 : 1)) * 100) / 100, min),
				max
			)
		}
		if (val !== value) {
			onChange?.(val, name)
		}
	}

	const captureFocus = e => {
		if (e.target.tagName === 'INPUT') return
		e.preventDefault()
		if (!disabled) numRef.current.focus()
	}

	return (
		<div
			id={name ? `range-${name}` : undefined}
			data-active={active || null}
			className={styles.cont}
			onKeyUp={onKeyDown}
			onMouseDown={captureFocus}
			disabled={disabled}
			data-range
		>
			<div className={styles.row}>
				<label ref={labelRef} htmlFor={name} onDoubleClick={onDoubleClick}>
					{label || name}
				</label>
				<input
					name={`${name}-value`}
					type='number'
					className={styles.text}
					value={value}
					step={natural_step}
					onChange={onTextChange}
					ref={numRef}
					tabIndex={disabled ? -1 : 0}
				/>
			</div>
			<input
				name={name}
				type='range'
				className={styles.range}
				value={value}
				min={min}
				max={max}
				step={step}
				onChange={onRangeChange}
				tabIndex={-1}
			/>
			{children}
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
	natural_step: PropTypes.number,
	initial: PropTypes.number,
	disabled: PropTypes.bool,
	children: PropTypes.node,
	active: PropTypes.bool,
}

export default Range
