/**
 *
 * CueList
 *
 */
import PropTypes from 'prop-types'
import { memo, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styles from './index.module.scss'
import {
	saveCue,
	selectCueIndex,
	selectCues,
	selectCueChanged,
	removeCues,
	sortCues,
	selectCueInputValue,
	setCueInputValue,
	selectSelectedCues,
	setSelectedCues,
	renameCue,
} from '~/lib/redux'
import { MdAdd, MdClose, MdPlayCircleFilled } from 'react-icons/md'
import { loadAndSendCue } from '~/lib/thunks'
import useDrag from '~/lib/useDrag'
import useClasses from '~/lib/useClasses'

const plainReg = /[^a-zA-Z0-9\- ]/g

const CueItem = ({ name, index, current, selected }) => {
	const dispatch = useDispatch()
	const inputRef = useRef()
	const [editing, setEditing] = useState(false)
	const [innerValue, setInnerValue] = useState(name)

	useEffect(() => {
		setInnerValue(name)
	}, [name])

	const onInputChange = e => {
		const val = e.target.value.substring(0, 36).replace(plainReg, '')
		setInnerValue(val)
	}

	const onBlur = () => {
		setEditing(false)
		if (innerValue !== name) {
			dispatch(renameCue({ name: innerValue.substring(0, 1).toUpperCase() + innerValue.substring(1), index }))
		}
	}

	return (
		<div
			name={name}
			data-index={index}
			style={{ order: index }}
			data-name={name}
			className={styles.item}
			data-current={current || undefined}
			data-selected={selected || undefined}
		>
			<div
				className={styles.name}
				onDoubleClick={() => {
					setInnerValue(name)
					setEditing(true)
					setTimeout(() => {
						inputRef.current?.focus()
					}, 0)
				}}
			>
				{editing ? (
					<input value={innerValue} onChange={onInputChange} onBlur={onBlur} ref={inputRef} />
				) : (
					<div>{name}</div>
				)}
			</div>
			<div className={styles.spacer} />
			<button className={styles.play} tabIndex={-1}>
				<MdPlayCircleFilled />
			</button>
			<button className={styles.remove} tabIndex={-1}>
				<MdClose />
			</button>
		</div>
	)
}

CueItem.propTypes = {
	name: PropTypes.string.isRequired,
	index: PropTypes.number.isRequired,
	current: PropTypes.bool,
	selected: PropTypes.bool,
}

const CueList = () => {
	const dispatch = useDispatch()
	const cues = useSelector(selectCues)
	const inputValue = useSelector(selectCueInputValue)
	const currentCueIndex = useSelector(selectCueIndex)
	const changed = useSelector(selectCueChanged)
	const selectedCues = useSelector(selectSelectedCues)
	const selectionRef = useRef({ first: -1, last: -1 })

	const onSort = ({ oldIndex, newIndex, length }) => {
		dispatch(sortCues({ oldIndex, newIndex, length }))
		const sel = selectionRef.current
		if (sel.first === oldIndex) {
			sel.first = newIndex
		}
		if (sel.last === oldIndex) {
			sel.last = newIndex
		}
	}

	const { isDragging } = useDrag({
		itemSelector: `.${styles.item}`,
		delay: 230,
		onChange: onSort,
		selectedNames: selectedCues,
	})

	const addNewCue = () => {
		document.getElementById('cue_name_input').blur()
		dispatch(saveCue())
	}

	const onListDown = e => {
		const item = e.target.closest(`.${styles.item}`)
		if (!item) return
		if (e.target.closest(`.${styles.handle}`)) {
			return
		}
		const index = parseInt(item.dataset.index)
		if (e.target.closest(`.${styles.remove}`)) {
			dispatch(removeCues(index))
			return
		}

		if (e.target.closest(`.${styles.play}`)) {
			if (index === currentCueIndex && changed) dispatch(saveCue(true))
			else dispatch(loadAndSendCue(index))
			return
		}

		// select
		if (!e.shiftKey) {
			const { first, last } = selectionRef.current
			const min = Math.min(first, last)
			const max = Math.max(first, last)
			if (index < min || index > max) {
				selectionRef.current.first = index
				selectionRef.current.last = index
				dispatch(setSelectedCues([cues[index].name]))
			}
		}
	}

	const onListClick = e => {
		const item = e.target.closest(`.${styles.item}`)
		if (!item || e.target.closest(`.${styles.remove}`)) return
		const index = parseInt(item.dataset.index)

		const sel = selectionRef.current
		let { first, last } = sel
		if (!e.shiftKey || first === -1) first = index
		last = index

		if (first === sel.first && last === sel.last) return

		sel.first = first
		sel.last = last

		if (sel.first === -1) {
			dispatch(setSelectedCues([]))
		} else if (sel.first === sel.last) {
			dispatch(setSelectedCues([cues[sel.first].name]))
		} else {
			const start = Math.min(sel.first, sel.last)
			const end = Math.max(sel.first, sel.last)
			dispatch(setSelectedCues(cues.slice(start, end + 1).map(f => f.name)))
		}
	}

	// const jumpToCue = index => {
	// 	dispatch(loadAndSendCue(index))
	// 	const item = document.querySelector(`.${styles.item}[data-index="${index}"]`)
	// 	if (item) {
	// 		item.scrollIntoView({ block: 'center', behavior: 'smooth' })
	// 	}
	// 	selectionRef.current = { first: index, last: index }
	// }

	const applySelection = () => {
		const { first, last } = selectionRef.current
		const min = Math.min(first, last)
		const max = Math.max(first, last)
		dispatch(setSelectedCues(cues.slice(min, max + 1).map(f => f.name)))
	}

	const onKeyDown = e => {
		if (e.target.tagName === 'INPUT') return
		const sel = selectionRef.current
		const { key, shiftKey } = e
		switch (key) {
			case 'ArrowUp':
				if (sel.first === -1) return
				if (shiftKey) {
					if (sel.last > 0) {
						e.preventDefault()
						sel.last--
						applySelection()
					}
				} else if (sel.first > 0) {
					e.preventDefault()
					sel.first--
					sel.last = sel.first
					applySelection()
				}
				break
			case 'ArrowDown':
				if (sel.first === -1) return
				if (shiftKey) {
					if (sel.last < cues.length - 1) {
						e.preventDefault()
						sel.last++
						applySelection()
					}
				} else if (sel.first < cues.length - 1) {
					e.preventDefault()
					sel.first++
					sel.last = sel.first
					applySelection()
				}
				break
			case 'Delete':
			case 'Backspace':
				if (selectedCues.length) dispatch(removeCues(selectedCues))
				break
			default:
				break
		}
	}

	const onDeselect = e => {
		if (!e.target.closest(`.${styles.item}`)) {
			selectionRef.current.first = -1
			selectionRef.current.last = -1
			dispatch(setSelectedCues([]))
		}
	}

	useEffect(() => {
		window.addEventListener('mousedown', onDeselect)
		return () => {
			window.removeEventListener('mousedown', onDeselect)
		}
	}, [])

	const cls = useClasses(styles.cont, isDragging && styles.dragging, changed && styles.changed)

	return (
		<div className={cls} onKeyDown={onKeyDown} tabIndex={0}>
			<div className={styles.header}>
				<div className={styles.cue_input}>
					<input
						id='cue_name_input'
						placeholder='Add cue name'
						onChange={e => dispatch(setCueInputValue(e.target.value))}
						value={inputValue}
						onKeyDown={e => {
							e.key === 'Enter' && addNewCue()
						}}
					/>
					<button onClick={addNewCue} className={styles.add}>
						<MdAdd />
					</button>
				</div>
			</div>
			<div className={styles.list} onClick={onListClick} onMouseDown={onListDown}>
				{cues.map((f, i) => (
					<CueItem
						{...f}
						key={f.name}
						index={i}
						selected={selectedCues.includes(f.name)}
						current={currentCueIndex === i}
					/>
				))}
			</div>
			<div className={styles.footer}></div>
		</div>
	)
}

export default memo(CueList)
