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
	setSelection,
	addCue,
} from '~/lib/redux'
import { MdAdd, MdClose, MdPlayCircleFilled } from 'react-icons/md'
import { loadAndSendCue } from '~/lib/thunks'
import useDrag from '~/lib/useDrag'
import useClasses from '~/lib/useClasses'

window.selection = { first: -1, last: -1 }

const plainReg = /[^a-zA-Z0-9\- ]/g

const CueItem = ({ name, index, current, renaming, onRename, selected }) => {
	const inputRef = useRef()
	const [innerValue, setInnerValue] = useState(name)

	useEffect(() => {
		setInnerValue(name)
	}, [name])

	useEffect(() => {
		if (renaming) {
			setInnerValue(name)
			setTimeout(() => {
				inputRef.current?.focus()
			}, 0)
		}
	}, [renaming])

	const onInputChange = e => {
		const val = e.target.value.substring(0, 36).replace(plainReg, '')
		setInnerValue(val)
	}

	const onBlur = () => {
		onRename(innerValue.substring(0, 1).toUpperCase() + innerValue.substring(1), index)
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
			<div className={styles.item_name}>
				{renaming ? (
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
	renaming: PropTypes.bool,
	onRename: PropTypes.func.isRequired,
}

const CueList = () => {
	const dispatch = useDispatch()
	const cues = useSelector(selectCues)
	const inputValue = useSelector(selectCueInputValue)
	const currentCueIndex = useSelector(selectCueIndex)
	const cueChanged = useSelector(selectCueChanged)
	const selectedCues = useSelector(selectSelectedCues)
	const ref = useRef()
	const inputRef = useRef()
	const [renaming, setRenaming] = useState(-1)

	const { isDragging } = useDrag({
		itemSelector: `.${styles.item}`,
		delay: 230,
		onChange: ({ oldIndex, newIndex, length }) => {
			dispatch(sortCues({ oldIndex, newIndex, length }))
		},
		selectedNames: selectedCues,
	})

	const onAddCue = () => {
		dispatch(addCue())
	}

	useEffect(() => {
		ref.current?.focus()
	}, [cues.length])

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
			if (index === currentCueIndex && cueChanged) dispatch(saveCue())
			else dispatch(loadAndSendCue(index))
			return
		}

		// select
		if (!e.shiftKey) {
			const { first, last } = window.selection
			const min = Math.min(first, last)
			const max = Math.max(first, last)
			if (index < min || index > max) {
				// window.selection.first = index
				// window.selection.last = index
				dispatch(setSelectedCues([cues[index].name]))
			}
		}
	}

	const onListClick = e => {
		const item = e.target.closest(`.${styles.item}`)
		if (!item || e.target.closest(`.${styles.remove}`)) return
		const index = parseInt(item.dataset.index)

		const sel = window.selection
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

	const onListDoubleClick = e => {
		if (!e.target.closest(`.${styles.item_name}`)) return
		const item = e.target.closest(`.${styles.item}`)
		if (!item) return
		const index = parseInt(item.dataset.index)
		setRenaming(index)
	}

	const onKeyDown = e => {
		const sel = window.selection
		const { key, ctrlKey, shiftKey } = e
		const IS_INPUT = e.target.tagName === 'INPUT'

		if (key === 'ArrowUp') {
			if (IS_INPUT) return
			if (sel.first === -1) return
			if (shiftKey) {
				if (sel.last > 0) {
					e.preventDefault()
					dispatch(setSelection([sel.first, sel.last - 1]))
				}
			} else if (sel.first > 0) {
				e.preventDefault()
				dispatch(setSelection(sel.first - 1))
			} else if (sel.first === 0) {
				e.preventDefault()
				dispatch(setSelection())
				inputRef.current.focus()
			}
		}
		if (key === 'ArrowDown') {
			if (IS_INPUT) {
				ref.current.focus()
			}
			if (sel.first === -1) {
				dispatch(setSelection(0))
			} else if (shiftKey) {
				if (sel.last < cues.length - 1) {
					e.preventDefault()
					dispatch(setSelection(sel.first, sel.last + 1))
				}
			} else if (sel.first < cues.length - 1) {
				e.preventDefault()
				dispatch(setSelection(sel.first + 1))
			}
		}

		if (IS_INPUT) return

		switch (key) {
			case 'Enter':
				if (
					!ctrlKey &&
					!shiftKey &&
					window.selection.first !== -1 &&
					window.selection.first !== currentCueIndex
				) {
					dispatch(loadAndSendCue(window.selection.first))
				}
				break
			case 'Delete':
			case 'Backspace':
				if (selectedCues.length) dispatch(removeCues(selectedCues))
				break
			case 'F2':
				if (renaming === -1 && sel.first !== -1) {
					e.preventDefault()
					setRenaming(sel.first)
				}
				break
			default:
				break
		}
	}

	const onDeselect = e => {
		if (!e.target.closest(`.${styles.item}`)) {
			window.selection.first = -1
			window.selection.last = -1
			dispatch(setSelectedCues([]))
		}
	}

	const onCueRename = (newName, index) => {
		setRenaming(-1)
		if (newName !== cues[index].name) {
			dispatch(renameCue({ name: newName, index }))
		}
		ref.current.focus()
	}

	useEffect(() => {
		window.addEventListener('mousedown', onDeselect)
		return () => {
			window.removeEventListener('mousedown', onDeselect)
		}
	}, [])

	const cls = useClasses(styles.cont, isDragging && styles.dragging, cueChanged && styles.changed)

	return (
		<div className={cls} onKeyDown={onKeyDown} tabIndex={0} ref={ref}>
			<div className={styles.header}>
				<div className={styles.cue_input}>
					<input
						id='cue_name_input'
						ref={inputRef}
						placeholder='Add cue name'
						onChange={e => dispatch(setCueInputValue(e.target.value))}
						value={inputValue}
						onKeyDown={e => {
							!e.ctrlKey && !e.shiftKey && e.key === 'Enter' && onAddCue()
						}}
					/>
					<button onClick={onAddCue} className={styles.add} tabIndex={-1}>
						<MdAdd />
					</button>
				</div>
			</div>
			<div
				className={styles.list}
				onClick={onListClick}
				onMouseDown={onListDown}
				onDoubleClick={onListDoubleClick}
			>
				{cues.map((f, i) => (
					<CueItem
						{...f}
						key={f.name}
						index={i}
						renaming={renaming === i}
						selected={selectedCues.includes(f.name)}
						current={currentCueIndex === i}
						onRename={onCueRename}
					/>
				))}
			</div>
			<div className={styles.footer}></div>
		</div>
	)
}

export default memo(CueList)
