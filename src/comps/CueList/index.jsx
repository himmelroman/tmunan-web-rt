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
		console.log('val', val)
		// setInnerValue(val)
	}

	const onBlur = () => {
		setEditing(false)
		if (innerValue !== name) {
			dispatch(renameCue({ name: innerValue.substring(0, 1).toUpperCase() + innerValue.substring(1), index }))
			// dispatch(saveCue({ name: innerValue, index }))
		}
	}

	return (
		<div
			name={name}
			data-index={index}
			style={{ order: index * 2 + 1 }}
			data-name={name}
			className={styles.item}
			data-current={current || undefined}
			data-selected={selected || undefined}
		>
			<div
				className={styles.name}
				onDoubleClick={() => {
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

	// const existingCue = useMemo(() => cues.find(f => f.name === inputValue), [cues, inputValue])

	const onSort = ({ oldIndex, newIndex }) => {
		dispatch(sortCues({ oldIndex, newIndex }))
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
		delay: 110,
		// handleSelector: `.${styles.item}[data-selected]`,
		onChange: onSort,
	})

	const addNewCue = () => {
		// blur input
		document.getElementById('cue_name_input').blur()
		// { name: inputValue || `Cue ${cues.length + 1}`, index: existingCue ? index + 1 : cues.length }
		dispatch(saveCue())
	}

	const onListClick = e => {
		const item = e.target.closest(`.${styles.item}`)
		if (!item) return
		const index = parseInt(item.dataset.index)
		if (e.target.closest(`.${styles.handle}`)) {
			return
		}
		if (e.target.closest(`.${styles.remove}`)) {
			dispatch(removeCues(index))
		} else if (e.target.closest(`.${styles.play}`)) {
			if (index === currentCueIndex && changed) dispatch(saveCue(true))
			else dispatch(loadAndSendCue(index))
		} else {
			// select
			const sel = selectionRef.current

			if (!e.shiftKey || sel.first === -1) {
				sel.first = index
			}
			sel.last = index

			if (sel.first === -1) {
				dispatch(setSelectedCues([]))
				return
			}

			if (sel.first === sel.last) {
				dispatch(setSelectedCues([cues[sel.first].name]))
				return
			}

			const start = Math.min(sel.first, sel.last)
			const end = Math.max(sel.first, sel.last)
			dispatch(setSelectedCues(cues.slice(start, end + 1).map(f => f.name)))
		}
	}

	const jumpToCue = index => {
		dispatch(loadAndSendCue(index))
		const item = document.querySelector(`.${styles.item}[data-index="${index}"]`)
		if (item) {
			item.scrollIntoView({ block: 'center', behavior: 'smooth' })
		}
	}

	const onKeyDown = e => {
		if (e.target.tagName === 'INPUT') return
		switch (e.key) {
			case 'ArrowUp':
				if (currentCueIndex) {
					e.preventDefault()
					jumpToCue(currentCueIndex - 1)
				}
				break
			case 'ArrowDown':
				if (currentCueIndex < cues.length - 1) {
					e.preventDefault()
					jumpToCue(currentCueIndex + 1)
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

	// useEffect(() => {
	// 	if (currentCueIndex !== -1) {
	// 		const item = document.querySelector(`.${styles.item}[data-index="${currentCueIndex}"]`)
	// 		if (item) {
	// 			item.scrollIntoView({ block: 'center', behavior: 'smooth' })
	// 		}
	// 	}
	// }, [currentCueIndex])

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
				{/* <button onClick={onAddSave} disabled={existingCue && !changed} className={styles.save}>
					<MdSave />
				</button> */}
			</div>
			<div className={styles.list} onMouseDown={onListClick}>
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
