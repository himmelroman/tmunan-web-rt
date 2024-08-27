/**
 *
 * CueList
 *
 */
import { memo, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styles from './index.module.scss'
import { saveCue, selectCueIndex, selectCues, selectCueChanged, removeCueAt, sortCues } from '~/lib/redux'
import { MdAdd, MdClose, MdDragIndicator, MdSave } from 'react-icons/md'
import { loadAndSendCue } from '~/lib/thunks'
import useDrag from '~/lib/useDrag'
import useClasses from '~/lib/useClasses'

const CueList = () => {
	const dispatch = useDispatch()
	const cues = useSelector(selectCues)
	const index = useSelector(selectCueIndex)
	const changed = useSelector(selectCueChanged)

	const [inputValue, setInputValue] = useState('')

	useEffect(() => {
		const cue = cues[index]
		if (cue) setInputValue(cue.name)
		else setInputValue('')
	}, [cues, index])

	const existingCue = useMemo(() => cues.find(f => f.name === inputValue), [cues, inputValue])

	const onSort = ({ oldIndex, newIndex }) => {
		dispatch(sortCues({ oldIndex, newIndex }))
	}

	const { isDragging } = useDrag({
		items: cues,
		itemSelector: `.${styles.item}`,
		handleSelector: `.${styles.handle}`,
		onChange: onSort,
	})

	const onAddSave = () => {
		// blur input
		document.getElementById('cue_name_input').blur()
		dispatch(
			saveCue({ name: inputValue || `Cue ${cues.length + 1}`, index: existingCue ? index + 1 : cues.length })
		)
	}

	const onListClick = e => {
		const item = e.target.closest(`.${styles.item}`)
		if (!item) return
		const { index } = item.dataset
		if (e.target.closest(`.${styles.handle}`)) {
			return
		}
		if (e.target.closest(`.${styles.remove}`)) {
			dispatch(removeCueAt(index))
		} else {
			dispatch(loadAndSendCue(index))
		}
	}

	const onKeyDown = e => {
		switch (e.key) {
			case 'ArrowUp':
				if (index) dispatch(loadAndSendCue(index - 1))
				break
			case 'ArrowDown':
				if (index < cues.length - 1) dispatch(loadAndSendCue(index + 1))
				break
			case 'Delete':
				if (index !== -1) dispatch(removeCueAt(index))
				break
			default:
				break
		}
	}

	const cls = useClasses(styles.cont, isDragging && styles.dragging)

	return (
		<div className={cls} onKeyDown={onKeyDown} tabIndex={0}>
			<div className={styles.header}>
				<input
					id='cue_name_input'
					type='text'
					placeholder='Add cue name'
					onChange={e => setInputValue(e.target.value)}
					value={inputValue}
					onKeyDown={e => {
						e.key === 'Enter' && onAddSave()
					}}
				/>
				<button
					onClick={onAddSave}
					disabled={existingCue && !changed}
					className={existingCue ? styles.save : styles.add}
				>
					{existingCue ? <MdSave /> : <MdAdd />}
				</button>
			</div>
			<div className={styles.list} onClick={onListClick}>
				{cues.map((f, i) => (
					<div
						name={f.name}
						key={`${f.name}-${i}`}
						data-index={i}
						style={{ order: i * 2 + 1 }}
						data-name={f.name}
						className={styles.item}
						data-current={i === index || undefined}
					>
						<button className={styles.handle} tabIndex={-1}>
							<MdDragIndicator />
						</button>
						<div className={styles.name}>{f.name}</div>
						<button className={styles.remove} tabIndex={-1}>
							<MdClose />
						</button>
					</div>
				))}
			</div>
		</div>
	)
}

export default memo(CueList)
