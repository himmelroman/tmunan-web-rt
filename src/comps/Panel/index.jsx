/**
 *
 * Panel
 *
 */
import debounce from 'debounce'
import { memo, useEffect } from 'react'
import FocusLock from 'react-focus-lock'
import { FaFolderOpen } from 'react-icons/fa6'
import { MdClose, MdFullscreen, MdFullscreenExit, MdInput, MdOutput, MdRefresh, MdReorder, MdSave } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { FILTER_LIST, NAME, VERSION } from '~/lib/constants'
import logger from '~/lib/logger'
import {
	initialState,
	loadCue,
	openFile,
	reset,
	saveCue,
	selectApp,
	selectConnected,
	setClientParameter,
	setDiffusionParameter,
	setFilter,
	setLocalProp,
	setShowCueList,
	setShowPanel,
	setTransform,
} from '~/lib/redux'
import socket from '~/lib/socket'
import useClasses from '~/lib/useClasses'
import Check from '../Check'
import CueList from '../CueList'
import Range from '../Range'
import Select from '../Select'
import Toggle from '../Toggle'
import styles from './index.module.scss'

// function debounce(func, timeout = 500) {
// 	let timer
// 	return (...args) => {
// 		clearTimeout(timer)
// 		timer = setTimeout(() => {
// 			func.apply(this, args)
// 		}, timeout)
// 	}
// }

const debouncedSend = debounce(socket.send, 200)

const debouncedText = debounce(socket.send, 500)

const Panel = () => {
	const dispatch = useDispatch()

	const app = useSelector(selectApp)
	const connected = useSelector(selectConnected)

	const { ably_state, rtc_state, camera, cameras, cue_index, cues, presence, show_cuelist, show_output, show_source } = app

	const { diffusion } = app.parameters

	const { filter, transform, fps, freeze, transition_duration } = app.parameters.client

	const { connections, active_connection_name } = presence

	const onLocalChange = (value, name) => {
		dispatch(setLocalProp([name, value]))
	}

	const onDiffusionParameter = (value, name) => {
		dispatch(setDiffusionParameter([name, value]))
		// socket.send('parameters', { [name]: Number(value), override: true })
		if (connected) debouncedSend('parameters', { diffusion: { [name]: value }, override: true })
	}

	const onText = e => {
		const { name, value } = e.target
		dispatch(setDiffusionParameter([name, value]))
		if (connected) debouncedText('parameters', { diffusion: { [name]: value }, override: true })
	}

	const onClientParameter = (value, name) => {
		dispatch(setClientParameter([name, value]))
		if (connected) debouncedSend('parameters', { client: { [name]: value }, override: true })
	}

	const onTransformChange = (value, name) => {
		dispatch(setTransform({ [name]: value }))
		if (connected) debouncedSend('parameters', { client: { transform: { [name]: value } }, override: true })
	}

	const onFilterChange = (value, name) => {
		dispatch(setFilter({ [name]: value }))
		if (connected) debouncedSend('parameters', { client: { filter: { [name]: value } }, override: true })
	}

	const onInvert = value => {
		dispatch(setFilter({ invert: value ? 1 : 0 }))
		if (connected) debouncedSend('parameters', { client: { filter: { [name]: value } }, override: true })
	}

	// const onBlack = value => {
	// 	if (value) {
	// 		window.ctx.fillRect(0, 0, WIDTH, HEIGHT)
	// 		window.stopStream()
	// 	}
	// 	dispatch(setLocalProp(['freeze', value]))
	// }

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

	const onReset = () => {
		socket.send('parameters', { ...initialState.parameters, override: true })
		dispatch(reset())
	}

	useEffect(() => {
		window.addEventListener('pointerdown', outsideClick)
		return () => {
			window.removeEventListener('pointerdown', outsideClick)
		}
	}, [])

	const cls = useClasses(styles.cont, connected && styles.connected)

	const ranges = FILTER_LIST.map(f => (
		<Range key={f.name} name={f.name} label={f.label} value={f.name in filter ? filter[f.name] : f.default} onChange={onFilterChange} min={f.min} max={f.max} step={f.step} initial={f.default} />
	))

	const onKeyDown = e => {
		// console.log('keydown', e.key)
		if (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type === 'text')) return
		const { code, ctrlKey } = e
		switch (code) {
			case 'Enter':
				e.preventDefault()
				const index = cue_index + 1
				const cue = cues[index]
				if (cues[index]) dispatch(loadCue({ cue, index }))
				break
			case 'KeyN':
				e.preventDefault()
				const name_input = document.getElementById('cue_name_input')
				name_input.focus()
				if (ctrlKey) {
					// create new cue
					dispatch(saveCue({ name: name_input.value, index: cue_index + 1 }))
				}
				break
			case 'KeyC':
				e.preventDefault()
				dispatch(setShowCueList(show_cuelist ? false : true))
				break
			default:
				break
		}
	}

	return (
		<FocusLock className={styles.lock}>
			<div className={cls} onKeyDown={onKeyDown} tabIndex={0}>
				<div className={styles.header}>
					<div className={styles.leds}>
						<div className={styles.led} data-state={ably_state} />
						<div className={styles.led} data-state={rtc_state} />
					</div>
					<button
						name='reload'
						onDoubleClick={() => {
							window.location.reload()
						}}
					>
						<MdRefresh />
					</button>
					<button name='reset' onClick={onReset}>
						{/* <MdLayersClear /> */}
						<span className='material-symbols-outlined' data-reset>
							reset_image
						</span>
					</button>
					<Check name='show_source' value={show_source} onChange={onLocalChange}>
						<MdInput />
					</Check>
					<Check name='show_output' value={show_output} onChange={onLocalChange}>
						<MdOutput />
					</Check>
					<button
						className={styles.fullscreen}
						onClick={() => {
							document.fullscreenElement ? document.exitFullscreen() : document.querySelector('body').requestFullscreen()
						}}
					>
						{document.fullscreenElement ? <MdFullscreenExit /> : <MdFullscreen />}
					</button>
					<div className={styles.sep}>/</div>
					<button onClick={() => dispatch(setShowCueList(show_cuelist ? false : true))}>
						<MdReorder />
						{/* <MdListAlt /> */}
					</button>
					{show_cuelist && (
						<>
							<button name='open' onClick={onOpen}>
								<FaFolderOpen />
							</button>
							<button name='save' onClick={onSave}>
								<MdSave />
							</button>
						</>
					)}
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
								<Select className={styles.select} name='camera' itemToString={a => window.cmap[a]} itemToValue={a => a} options={cameras} value={camera} onChange={onLocalChange} />
							</div>
						</div>
						<div className={styles.row}>
							<Range
								name='strength'
								label='Strength'
								value={diffusion.strength}
								onChange={onDiffusionParameter}
								min={1}
								max={3}
								step={0.01}
								initial={initialState.parameters.diffusion.strength}
							/>
							<Range
								name='guidance_scale'
								label='Guidance'
								value={diffusion.guidance_scale}
								onChange={onDiffusionParameter}
								min={0}
								max={1}
								step={0.01}
								initial={initialState.parameters.diffusion.guidance_scale}
							/>
						</div>
						<div className={styles.row}>
							<Range name='seed' label='Seed' value={diffusion.seed} onChange={onDiffusionParameter} min={0} max={30} step={1} initial={initialState.parameters.diffusion.seed} />
							<Range name='fps' label='FPS' value={fps} onChange={onClientParameter} min={1} max={30} step={1} initial={initialState.parameters.fps} />
						</div>
						<div className={`${styles.row} ${styles.prompt}`} data-1>
							<div className={styles.col}>
								<textarea name='prompt' value={diffusion.prompt} placeholder='Prompt' onChange={onText} />
								{/* <textarea name='negative_prompt' value={diffusion.negative_prompt} placeholder='Negative prompt' onChange={onText} /> */}
							</div>
						</div>
						<div className={styles.row} data-4>
							<div className={styles.col}>
								<label>Flip X</label>
								<Toggle name='flip_x' value={transform.flip_x} onChange={onTransformChange} />
							</div>
							<div className={styles.col}>
								<label>Flip Y</label>
								<Toggle name='flip_y' value={transform.flip_y} onChange={onTransformChange} />
							</div>
							<div className={styles.col}>
								<label>Invert</label>
								<Toggle name='invert' value={filter.invert || 0} onChange={onInvert} />
							</div>
							<div className={styles.col}>
								<label>Stop</label>
								<Toggle name='freeze' value={freeze} onChange={onClientParameter} />
							</div>
						</div>
						<div className={styles.row}>{[ranges[0], ranges[1]]}</div>
						<div className={styles.row}>{[ranges[2], ranges[3]]}</div>
						<div className={styles.row}>{[ranges[4], ranges[5]]}</div>
						<div className={styles.row}>
							<Range
								name='transition_duration'
								label='Transition'
								value={transition_duration}
								onChange={onClientParameter}
								min={0}
								max={10}
								step={0.1}
								initial={initialState.parameters.transition_duration}
							/>
						</div>
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
							<CueList />
						</section>
					)}
				</main>
				<div className={styles.version}>{VERSION}</div>
			</div>
		</FocusLock>
	)
}

export default memo(Panel)
