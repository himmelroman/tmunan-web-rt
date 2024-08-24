/**
 *
 * CueList
 *
 */
import { memo, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styles from './index.module.scss'
import { saveCue, selectCueIndex, selectCues, loadCue, selectCueChanged, removeCueAt } from '~/lib/redux'
import { MdAdd, MdClose, MdSave } from 'react-icons/md'
import socket from '~/lib/socket'

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
			const index = cues.findIndex(a => a.name === e.target.dataset.name)
			if (index === -1) return
			const cue = cues[index]
			socket.send('parameters', { ...cue, override: true })
			dispatch(loadCue({ cue, index }))
		}
	}

	const onKeyDown = e => {
		switch (e.key) {
			case 'ArrowUp':
				if (index) dispatch(loadCue(cues[index - 1]?.name))
				break
			case 'ArrowDown':
				if (index < cues.length - 1) dispatch(loadCue(cues[index + 1]?.name))
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
						<div className={styles.name} data-name={f.name}>
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
