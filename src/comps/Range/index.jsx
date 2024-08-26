/**
 *
 * Range
 *
 */
import PropTypes from 'prop-types'

import styles from './index.module.scss'
import useDoubleClick from 'use-double-click'
import { useRef } from 'react'

const Range = ({
	name,
	label,
	value,
	onChange,
	min = 0,
	max = 100,
	initial = 0,
	step = 1,
	disabled,
	children,
	active,
}) => {
	const labelRef = useRef()
	const numRef = useRef()

	useDoubleClick({
		onDoubleClick: e => {
			e.preventDefault()
			onChange?.(initial, name)
		},
		ref: labelRef,
	})

	const onRangeChange = e => {
		const val = parseFloat(e.target.value)
		onChange?.(isNaN(val) ? initial : val, name)
	}

	const onTextInput = e => {
		console.log('input', e.target.value)
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

		if (val !== value) {
			console.log('change', value, '>', val)
			onChange?.(val, name)
		}
	}

	const onKeyDown = e => {
		const { ctrlKey, altKey, key } = e
		if (
			!ctrlKey &&
			e.target.tagName === 'INPUT' &&
			!/(\.|Tab|\d|Enter|Escape|Backspace|Delete|ArrowLeft|ArrowRight)/.test(key)
		) {
			// console.log('preventing', key)
			e.preventDefault()
		}
		let val = value
		if (key === 'ArrowUp') {
			val = Math.min(
				Math.max(Math.round((value + step * (ctrlKey ? 10 : altKey ? 0.1 : 1)) * 100) / 100, min),
				max
			)
		} else if (key === 'ArrowDown') {
			val = Math.min(
				Math.max(Math.round((value - step * (ctrlKey ? 10 : altKey ? 0.1 : 1)) * 100) / 100, min),
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
			onKeyDown={onKeyDown}
			onMouseDown={captureFocus}
			// onMouseUp={() => {
			// 	!disabled &&
			// 		setTimeout(() => {
			// 			numRef.current.focus()
			// 			// select all text
			// 			numRef.current.setSelectionRange(0, numRef.current.value.length)
			// 		}, 0)
			// }}
			disabled={disabled}
			data-range
		>
			<div className={styles.row}>
				<label ref={labelRef} htmlFor={name}>
					{label || name}
				</label>
				<input
					name={`${name}-value`}
					type='number'
					className={styles.text}
					value={value}
					onInput={onTextInput}
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
	initial: PropTypes.number,
	disabled: PropTypes.bool,
	children: PropTypes.node,
	active: PropTypes.bool,
}

export default Range
