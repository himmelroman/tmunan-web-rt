/**
 *
 * CueList
 *
 */
import { memo, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styles from './index.module.scss'
import { saveCue, selectCueIndex, selectCues, selectCueChanged, removeCueAt } from '~/lib/redux'
import { MdAdd, MdClose, MdSave } from 'react-icons/md'
import { loadAndSendCue } from '~/lib/thunks'

const CueList = () => {
	const dispatch = useDispatch()
	const cues = useSelector(selectCues)
	const index = useSelector(selectCueIndex)

	const [inputValue, setInputValue] = useState('')

	useEffect(() => {
		const cue = cues[index]
		if (cue) setInputValue(cue.name)
		else setInputValue('')
	}, [cues, index])

	const existingCue = useMemo(() => cues.find(f => f.name === inputValue), [cues, inputValue])

	const changed = useSelector(selectCueChanged)

	const onAddSave = () => {
		// blur input
		document.getElementById('cue_name_input').blur()
		dispatch(
			saveCue({ name: inputValue || `Cue ${cues.length + 1}`, index: existingCue ? index + 1 : cues.length })
		)
	}

	const onListClick = e => {
		const rem = e.target.closest(`.${styles.remove}`)
		if (rem) {
			dispatch(removeCueAt(rem.dataset.index))
		} else if (e.target.classList.contains(styles.name)) {
			dispatch(loadAndSendCue(e.target.dataset.index))
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

	return (
		<div className={styles.cont} onKeyDown={onKeyDown} tabIndex={0}>
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
						key={f.name}
						data-index={i}
						data-name={f.name}
						className={styles.item}
						data-current={i === index || undefined}
						tabIndex={0}
					>
						<div className={styles.name} data-name={f.name} data-index={i}>
							{f.name}
						</div>
						<button data-name={f.name} className={styles.remove} data-index={i}>
							<MdClose />
						</button>
					</div>
				))}
			</div>
		</div>
	)
}

export default memo(CueList)
