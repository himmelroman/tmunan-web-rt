/**
 *
 * Toggle
 *
 */

import PropTypes from 'prop-types'
import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { useMeasure } from 'react-use'

import useClasses from '~/lib/useClasses'
import styles from './index.module.scss'

const noop = e => {
	e.preventDefault()
}

const Toggle = ({ name, onChange, value, className, disabled, style, ...props }) => {
	const inputRef = useRef()
	const timeRef = useRef()

	const [bgRef, { width: bw, height: bh }] = useMeasure()
	const [hRef, { width: hw, height: hh }] = useMeasure()

	const [uncheckedPos, checkedPos] = useMemo(() => [hw / 2, bw - hw / 2], [bw, bh, hw, hh])

	const xRef = useRef(value ? checkedPos : uncheckedPos)

	// Dragging

	const [isDragging, setIsDragging] = useState(false)
	const dragRef = useRef(isDragging)

	useEffect(() => {
		dragRef.current = isDragging
	}, [isDragging])

	// Position

	const [pos, setPos] = useState(value ? checkedPos : uncheckedPos)
	const posRef = useRef(pos)

	useEffect(() => {
		posRef.current = pos
	}, [pos])

	useEffect(() => {
		setPos(value ? checkedPos : uncheckedPos)
	}, [value, checkedPos, uncheckedPos])

	// Events

	const onInnerChange = useCallback(() => {
		onChange(!value, name)
	}, [value, onChange])

	const onDragStart = clientX => {
		inputRef.current.focus()
		timeRef.current = Date.now()
		xRef.current = clientX
	}

	const onDrag = useCallback(
		clientX => {
			if (!dragRef.current && clientX !== xRef.current) {
				setIsDragging(true)
			}

			const startPos = value ? checkedPos : uncheckedPos
			const mousePos = startPos + clientX - xRef.current
			const newPos = Math.min(checkedPos, Math.max(uncheckedPos, mousePos))
			if (newPos !== posRef.current) setPos(newPos)
		},
		[value, checkedPos, uncheckedPos, setPos]
	)

	const onDragStop = useCallback(() => {
		const dif = Date.now() - timeRef.current
		if (!dragRef.current || dif < 100) {
			onChange(!value, name)
			return
		}

		const half = (checkedPos + uncheckedPos) / 2
		const nextValue = posRef.current >= half

		if (value !== nextValue) {
			onChange(nextValue, name)
		} else {
			setPos(value ? checkedPos : uncheckedPos)
		}

		setIsDragging(false)
	}, [value, checkedPos, uncheckedPos, onChange, setPos])

	const onMouseMove = e => {
		e.preventDefault()
		onDrag(e.clientX)
	}

	// Ref Events

	const onMouseUp = e => {
		onDragStop(e)
		window.removeEventListener('mousemove', onMouseMove)
		window.removeEventListener('mouseup', onMouseUp)
	}

	const onMouseDown = e => {
		e.preventDefault()
		if (typeof e.button === 'number' && e.button !== 0) return
		onDragStart(e.clientX)
		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)
	}

	const onTouchStart = e => {
		onDragStart(e.touches[0].clientX)
	}

	const onTouchMove = e => {
		onDrag(e.touches[0].clientX)
	}

	const onTouchEnd = e => {
		e.preventDefault()
		onDragStop(e)
	}

	const onClick = useCallback(
		e => {
			if (e.target.className.includes('handle')) return
			e.preventDefault()
			onChange(!value, name)
		},
		[value, onChange]
	)

	const cls = useClasses(
		styles.cont,
		className,
		disabled && styles.disabled,
		isDragging && styles.dragging,
		value && styles.checked
	)

	return (
		<div
			name={name}
			id={`toggle_${name}`}
			className={cls}
			style={style}
			data-input='boolean'
			data-toggle
			data-checked={value || undefined}
			onClick={onClick}
			onMouseDown={noop}
		>
			<div className={styles.bg} data-el='bg' ref={bgRef}>
				<div
					className={styles.handle}
					style={{ left: `${pos}px` }}
					onClick={noop}
					onMouseDown={onMouseDown}
					onTouchStart={onTouchStart}
					onTouchMove={onTouchMove}
					onTouchEnd={onTouchEnd}
					data-handle
				>
					<div className={styles.inner_handle} ref={hRef} />
				</div>
				<input
					type='checkbox'
					role='switch'
					className={styles.input}
					checked={value}
					disabled={disabled}
					ref={inputRef}
					onChange={onInnerChange}
					{...props}
				/>
			</div>
		</div>
	)
}

Toggle.propTypes = {
	name: PropTypes.string.isRequired,
	onChange: PropTypes.func,
	value: PropTypes.oneOf([true, false, 0, 1]),
	className: PropTypes.string,
	disabled: PropTypes.bool,
	style: PropTypes.object,
}

export default Toggle
