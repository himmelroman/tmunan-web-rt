/**
 *
 * Panel
 *
 */
import { memo, useEffect } from 'react'
import { MdClose, MdFullscreen, MdFullscreenExit, MdInput, MdOutput, MdRefresh, MdReorder, MdSave } from 'react-icons/md'
import { FaFolderOpen } from 'react-icons/fa6'
import { useDispatch, useSelector } from 'react-redux'
import FocusLock from 'react-focus-lock'

// import { NAME } from '~/lib/constants'
import { FILTER_LIST, NAME } from '~/lib/constants'
import logger from '~/lib/logger'
import { setFilter, selectApp, setTransform, setShowClients, setShowPanel, setProp, setParameters, initialParameters, initialState, openFile } from '~/lib/redux'
import socket from '~/lib/socket'
import useClasses from '~/lib/useClasses'
import Range from '../Range'
import Select from '../Select'
import Toggle from '../Toggle'
import styles from './index.module.scss'
import Check from '../Check'
import CueList from '../CueList'

function debounce(func, timeout = 300) {
	let timer
	return (...args) => {
		clearTimeout(timer)
		timer = setTimeout(() => {
			func.apply(this, args)
		}, timeout)
	}
}

const debouncedSend = debounce(socket.send, 200)

const Panel = () => {
	const dispatch = useDispatch()

	const { blackout, fps, camera, transform, filter, cameras, connected, active, show_cuelist, show_source, show_output, presence, cues, cue_index } = useSelector(selectApp)

	const { parameters, connections, active_connection_name } = presence

	// const [prompt, setPrompt] = useState('')
	// const [negativePrompt, setNegativePrompt] = useState('')

	const onParameter = (value, name) => {
		dispatch(setParameters({ [name]: value }))
		// socket.send('set_parameters', { [name]: Number(value), override: true })
		if (connected) debouncedSend('set_parameters', { [name]: value, override: true })
	}

	const onText = e => {
		const { name, value } = e.target
		dispatch(setParameters({ [name]: value }))
		if (connected) debouncedSend('set_parameters', { [name]: value, override: true })
	}

	const onChange = (value, name) => {
		dispatch(setProp([name, value]))
	}

	const onTransform = (value, name) => {
		dispatch(setTransform({ [name]: value }))
	}

	const onInvert = value => {
		dispatch(setFilter({ invert: value ? 1 : 0 }))
	}

	const onFilterChange = (value, name) => {
		dispatch(setFilter({ [name]: value }))
	}

	const outsideClick = e => {
		if (e.target.closest(`.${styles.cont}`)) return
		dispatch(setShowPanel(false))
	}

	const onConnectionClick = e => {
		const { name } = e.target.closest(`.${styles.connection}`).dataset
		logger.info('set active name', name)
		socket.send('set_active_name', { name })
	}

	const onOpen = () => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = '.json'
		input.onchange = e => {
			const file = e.target.files[0]
			const reader = new FileReader()
			reader.onload = e => {
				const data = JSON.parse(e.target.result)
				logger.info('open', data)
				dispatch(openFile(data))
			}
			reader.readAsText(file)
		}
		input.click()
	}

	const onSave = () => {
		const data = JSON.stringify({ cues, cue_index })
		const blob = new Blob([data], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `tmunan_${NAME}.json`
		a.click()
		URL.revokeObjectURL(url)
	}

	useEffect(() => {
		window.addEventListener('pointerdown', outsideClick)
		return () => {
			window.removeEventListener('pointerdown', outsideClick)
		}
	}, [])

	const cls = useClasses(styles.cont, connected && styles.connected, active && styles.active)

	const ranges = FILTER_LIST.map(f => (
		<Range key={f.name} name={f.name} label={f.label} value={f.name in filter ? filter[f.name] : f.default} onChange={onFilterChange} min={f.min} max={f.max} step={f.step} initial={f.default} />
	))

	const onKeyDown = e => {
		// return if target is textarea or input of type text
		if (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type === 'text')) return
		switch (e.code) {
			// case 'Escape':
			// 	dispatch(setShowPanel(false))
			// 	break
			case 'KeyN':
				e.preventDefault()
				const name_input = document.getElementById('cue_name_input')
				if (name_input) name_input.focus()
				break
			default:
				break
		}
	}

	return (
		<div className={cls} onKeyDown={onKeyDown}>
			<FocusLock>
				<div className={styles.header}>
					<div className={styles.led} data-connected />
					<button
						className={styles.fullscreen}
						onClick={() => {
							document.fullscreenElement ? document.exitFullscreen() : document.querySelector('body').requestFullscreen()
						}}
					>
						{document.fullscreenElement ? <MdFullscreenExit /> : <MdFullscreen />}
					</button>
					<button
						onClick={() => {
							window.location.reload()
						}}
					>
						<MdRefresh />
					</button>
					<button onClick={() => dispatch(setShowClients(show_cuelist ? false : true))}>
						<MdReorder />
					</button>
					<Check name='show_source' value={show_source} onChange={onChange}>
						<MdInput />
					</Check>
					<Check name='show_output' value={show_output} onChange={onChange}>
						<MdOutput />
					</Check>
					<button name='open' onClick={onOpen}>
						<FaFolderOpen />
					</button>
					<button onClick={onSave}>
						<MdSave />
					</button>
					<div className={styles.right}>
						<button onClick={() => dispatch(setShowPanel(false))}>
							<MdClose />
						</button>
					</div>
				</div>
				<main>
					<section>
						<div className={styles.row} data-1>
							<div className={styles.col}>
								<Select className={styles.select} name='camera' itemToString={a => window.cmap[a]} itemToValue={a => a} options={cameras} value={camera} onChange={onChange} />
							</div>
						</div>
						<div className={styles.row}>
							<Range name='strength' label='Strength' value={parameters.strength} onChange={onParameter} min={1} max={3} step={0.01} initial={initialParameters.strength} />
							<Range
								name='guidance_scale'
								label='Guidance'
								value={parameters.guidance_scale}
								onChange={onParameter}
								min={0}
								max={1}
								step={0.01}
								initial={initialParameters.guidance_scale}
							/>
						</div>
						<div className={styles.row}>
							<Range name='seed' label='Seed' value={parameters.seed} onChange={onParameter} min={0} max={30} step={1} initial={initialParameters.seed} />
							<Range name='fps' label='FPS' value={fps} onChange={onChange} min={1} max={30} step={1} initial={initialState.fps} />
						</div>
						<div className={`${styles.row} ${styles.prompt}`} data-1>
							<div className={styles.col}>
								<textarea name='prompt' value={parameters.prompt} placeholder='Prompt' onChange={onText} />
								<textarea name='negative_prompt' value={parameters.negativePrompt} placeholder='Negative prompt' onChange={onText} />
							</div>
						</div>
						<div className={styles.row} data-4>
							<div className={styles.col}>
								<label>Flip X</label>
								<Toggle name='flip_x' value={transform.flip_x} onChange={onTransform} />
							</div>
							<div className={styles.col}>
								<label>Flip Y</label>
								<Toggle name='flip_y' value={transform.flip_y} onChange={onTransform} />
							</div>
							<div className={styles.col}>
								<label>Invert</label>
								<Toggle name='invert' value={filter.invert || 0} onChange={onInvert} />
							</div>
							<div className={styles.col}>
								<label>Blackout</label>
								<Toggle name='blackout' value={blackout} onChange={onChange} />
							</div>
						</div>
						<div className={styles.row}>{[ranges[0], ranges[1]]}</div>
						<div className={styles.row}>{[ranges[2], ranges[3]]}</div>
						<div className={styles.row}>{[ranges[4], ranges[5]]}</div>
						{connections.length ? (
							<div className={styles.connections}>
								{connections.map((c, i) => (
									<div
										key={i}
										className={styles.connection}
										data-name={c.name}
										data-self={NAME === c.name || null}
										data-active={c.name === active_connection_name || null}
										onClick={onConnectionClick}
									>
										{c.name}
										{NAME === c.name && ' (You)'}
									</div>
								))}
							</div>
						) : null}
					</section>
					{show_cuelist && (
						<section>
							{/* <div className={styles.heading}>Connections</div> */}
							<CueList />
						</section>
					)}
				</main>
			</FocusLock>
		</div>
	)
}

export default memo(Panel)
