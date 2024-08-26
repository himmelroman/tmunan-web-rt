/**
 *
 * Panel
 *
 */
import { memo, useEffect, useMemo, useState } from 'react'
import { getProperty } from 'dot-prop'
import FocusLock from 'react-focus-lock'
import { FaFolderOpen } from 'react-icons/fa6'
import {
	MdClose,
	MdFullscreen,
	MdFullscreenExit,
	MdInput,
	MdOutput,
	MdRefresh,
	MdReorder,
	MdSave,
	MdTune,
} from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import {
	CAMERA_PROPS,
	DIFFUSION_RANGES,
	FILTER_RANGES,
	IS_CONTROL,
	NAME,
	PARAMETER_SCHEMA,
	VERSION,
} from '~/lib/constants'
import logger from '~/lib/logger'
import {
	defaultState,
	openFile,
	reset,
	saveCue,
	selectApp,
	selectConnected,
	setCameraSetting,
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
import store from '~/lib/redux'
import Check from '../Check'
import CueList from '../CueList'
import Range from '../Range'
import Select from '../Select'
import Toggle from '../Toggle'
import styles from './index.module.scss'
import { camelToFlat } from '~/lib/utils'
import { loadAndSendCue } from '~/lib/thunks'

const onLocalChange = (value, name) => {
	store.dispatch(setLocalProp([name, value]))
}

const onDiffusionParameterChange = (value, name) => {
	store.dispatch(setDiffusionParameter([name, value]))
	socket.debouncedSend('parameters', { diffusion: { [name]: value }, override: true })
}

const onClientParameterChange = (value, name) => {
	store.dispatch(setClientParameter([name, value]))
	socket.debouncedSend('parameters', { client: { [name]: value }, override: true })
}

const onTransformParameterChange = (value, name) => {
	store.dispatch(setTransform({ [name]: value }))
	socket.debouncedSend('parameters', { client: { transform: { [name]: value } }, override: true })
}

const onFilterParameterChange = (value, name) => {
	store.dispatch(setFilter({ [name]: value }))
	socket.debouncedSend('parameters', { client: { filter: { [name]: value } }, override: true })
}

const parameterCallbacks = {
	diffusion: onDiffusionParameterChange,
	filter: onFilterParameterChange,
	client: onClientParameterChange,
}

const onInvert = value => {
	console.log('onInvert', value)
	const s = store.getState()
	const invert = value ? 1 : 0
	if (invert === s.app.parameters.client.filter.invert) return

	store.dispatch(setFilter({ invert }))
	const connected = selectConnected(s)
	if (connected) socket.send('parameters', { client: { filter: { invert } }, override: true })
}

const onKeyDown = e => {
	const { app } = store.getState()
	if (app.active_range && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
		e.preventDefault()
		e.stopPropagation()
		const prop = app.active_range
		const schema = PARAMETER_SCHEMA[prop]
		const callback = parameterCallbacks[schema.parameter_type]
		if (!callback) {
			logger.error('Unknown range type', prop)
			return
		}
		const value = getProperty(app, schema.path)
		let newValue = value

		if (e.code === 'ArrowUp') {
			newValue += schema.step
		} else {
			newValue -= schema.step
		}
		newValue = Math.round(Math.min(Math.max(newValue, schema.min), schema.max) * 100) / 100

		console.log(prop, value, '>', newValue)
		callback(newValue, prop)
		return
	}
	if (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type === 'text')) return
	const { code, ctrlKey } = e
	switch (code) {
		case 'Enter':
			e.preventDefault()
			store.dispatch(loadAndSendCue(app.cue_index + 1))
			break
		case 'KeyN':
			e.preventDefault()
			const name_input = document.getElementById('cue_name_input')
			name_input.focus()
			if (ctrlKey) {
				// create new cue
				store.dispatch(saveCue({ name: name_input.value, index: app.cue_index + 1 }))
			}
			break
		case 'KeyI':
			onInvert(app.parameters.client.filter.invert ? 0 : 1)
			break
		default:
			break
	}
}

const Panel = () => {
	const dispatch = useDispatch()

	const app = useSelector(selectApp)
	const connected = useSelector(selectConnected)

	const {
		ably_state,
		rtc_state,
		camera,
		cameras,
		camera_settings,
		cue_index,
		cues,
		presence,
		show_cuelist,
		active_range,
		show_output,
		show_source,
	} = app
	const { diffusion } = app.parameters
	const { filter, transform, fps, freeze, transition_duration } = app.parameters.client
	const { connections, active_connection_name } = presence

	const [camExpanded, setCameExpanded] = useState(false)
	const [currentPrompt, setCurrentPrompt] = useState(diffusion.prompt)

	const promptChanged = useMemo(() => currentPrompt !== diffusion.prompt, [currentPrompt, diffusion.prompt])

	useEffect(() => {
		setCurrentPrompt(diffusion.prompt)
	}, [diffusion.prompt])

	const onCameraSettingChange = (value, name) => {
		dispatch(setCameraSetting([name, value]))
		window.camera_track.applyConstraints({ [name]: value })
	}

	const onCameraAuto = e => {
		const { name } = e.target
		const value = camera_settings[name].value === 'manual' ? 'continuous' : 'manual'
		dispatch(setCameraSetting([name, value]))
		window.camera_track.applyConstraints({ [name]: value })
	}

	const onPrompt = e => {
		// eslint-disable-next-line no-unused-vars
		const { _, value } = e.target
		setCurrentPrompt(value)
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
		socket.send('parameters', { ...defaultState.parameters, override: true })
		dispatch(reset())
	}

	useEffect(() => {
		window.addEventListener('pointerdown', outsideClick)
		window.addEventListener('keydown', onKeyDown, true)
		return () => {
			window.removeEventListener('pointerdown', outsideClick)
			window.removeEventListener('keydown', onKeyDown, true)
		}
	}, [])

	useEffect(() => {
		const pdiv = document.getElementById('camera-wrap')
		if (camExpanded) {
			const cdiv = document.getElementById('camera-settings')
			const { height } = cdiv.getBoundingClientRect()
			pdiv.style.setProperty('max-height', `${height}px`)
		} else {
			pdiv.style.removeProperty('max-height')
		}
	}, [camExpanded])

	const filterDivs = FILTER_RANGES.map(f => (
		<Range
			key={f.name}
			name={f.name}
			label={f.label}
			value={f.name in filter ? filter[f.name] : f.default}
			onChange={onFilterParameterChange}
			min={f.min}
			max={f.max}
			step={f.step}
			initial={f.default}
			active={active_range === f.name || null}
		/>
	))

	const diffusionDivs = DIFFUSION_RANGES.map(f => (
		<Range
			key={f.name}
			name={f.name}
			label={f.label}
			value={diffusion[f.name]}
			onChange={onDiffusionParameterChange}
			min={f.min}
			max={f.max}
			step={f.step}
			initial={f.default}
			active={active_range === f.name || null}
		/>
	))

	const cameraSettingsDiv = useMemo(() => {
		if (!camera_settings) return null

		const rows = []
		const prev_parents = {}

		CAMERA_PROPS.forEach(({ name, label, row, parent }) => {
			const entry = camera_settings[name]
			if (row === undefined || !entry) return
			if (!rows[row]) rows[row] = []

			let auto
			if (parent && !prev_parents[parent]) {
				prev_parents[parent] = true
				const manual = camera_settings[parent].value === 'manual'
				auto = (
					<button
						className={styles.camera_auto}
						name={parent}
						data-active={manual || null}
						onClick={onCameraAuto}
						tabIndex={-1}
					>
						{manual ? 'M' : 'A'}
					</button>
				)
			}

			rows[row].push(
				<Range
					key={name}
					name={name}
					label={label || camelToFlat(name)}
					value={parseInt(entry.value)}
					onChange={onCameraSettingChange}
					min={entry.min}
					max={entry.max}
					step={entry.step}
					initial={entry.initial}
					disabled={!camExpanded || entry.disabled}
				>
					{auto}
				</Range>
			)
		})

		return (
			<div id='camera-settings' className={styles.camera_settings}>
				{rows.map((r, i) => (
					<div key={i} className={styles.row}>
						{r}
					</div>
				))}
			</div>
		)
	}, [camera_settings, camExpanded])

	const cls = useClasses(
		styles.cont,
		connected && styles.connected,
		show_cuelist && styles.show_cuelist,
		IS_CONTROL && styles.control
	)

	return (
		<FocusLock className={styles.lock}>
			<div className={cls} tabIndex={0}>
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

					<Check name='show_source' value={show_source} onChange={onLocalChange}>
						<MdInput />
					</Check>
					<Check name='show_output' value={show_output} onChange={onLocalChange}>
						<MdOutput />
					</Check>
					<button
						name='fullscreen'
						className={styles.fullscreen}
						onClick={() => {
							document.fullscreenElement
								? document.exitFullscreen()
								: document.querySelector('body').requestFullscreen()
						}}
					>
						{document.fullscreenElement ? <MdFullscreenExit /> : <MdFullscreen />}
					</button>
					<button name='reset' onClick={onReset}>
						<span className='material-symbols-outlined'>reset_image</span>
					</button>
					<div className={styles.sep}>/</div>
					<button name='show_cuelist' onClick={() => dispatch(setShowCueList(show_cuelist ? false : true))}>
						<MdReorder />
					</button>
					<button name='open' onClick={onOpen}>
						<FaFolderOpen />
					</button>
					<button name='save' onClick={onSave}>
						<MdSave />
					</button>
					<div className={styles.right}>
						<button name='close' onClick={() => dispatch(setShowPanel(false))}>
							<MdClose />
						</button>
					</div>
				</div>
				<main>
					<div className={styles.column} data-page='1'>
						<div id='camera-field' className={styles.camera_field} data-expanded={camExpanded || null}>
							<div className={styles.header}>
								<Select
									className={styles.select}
									name='camera'
									itemToString={a => window.cmap[a]}
									itemToValue={a => a}
									options={cameras}
									value={camera}
									onChange={onLocalChange}
								/>
								{camera_settings && (
									<button onClick={() => setCameExpanded(!camExpanded)}>
										<MdTune />
									</button>
								)}
							</div>
							<div id='camera-wrap' className={styles.wrap}>
								{cameraSettingsDiv}
							</div>
						</div>
						<div className={styles.row}>
							{[diffusionDivs[0], diffusionDivs[1]]}
							{/* <Range
								name='strength'
								label='Strength'
								value={diffusion.strength}
								onChange={onDiffusionParameterChange}
								min={1}
								max={3}
								step={0.1}
								initial={defaultState.parameters.diffusion.strength}
								active={active_range === 'strength' || null}
							/>
							<Range
								name='guidance_scale'
								label='Guidance'
								value={diffusion.guidance_scale}
								onChange={onDiffusionParameterChange}
								min={0}
								max={1}
								step={0.1}
								initial={defaultState.parameters.diffusion.guidance_scale}
							/> */}
						</div>
						<div className={styles.row}>
							{diffusionDivs[2]}
							{/* <Range
								name='seed'
								label='Seed'
								value={diffusion.seed}
								onChange={onDiffusionParameterChange}
								min={0}
								max={30}
								step={1}
								initial={defaultState.parameters.diffusion.seed}
								active={active_range === 'seed' || null}
							/> */}
							<Range
								name='fps'
								label={PARAMETER_SCHEMA.fps.label}
								value={fps}
								onChange={onClientParameterChange}
								min={PARAMETER_SCHEMA.fps.min}
								max={PARAMETER_SCHEMA.fps.max}
								step={PARAMETER_SCHEMA.fps.step}
								initial={PARAMETER_SCHEMA.fps.default}
							/>
						</div>
						<div className={`${styles.row} ${styles.prompt_row}`} data-1>
							<div className={styles.field} data-prompt data-changed={promptChanged || null}>
								<textarea
									name='prompt'
									value={currentPrompt}
									data-noblur
									placeholder='Prompt'
									onChange={onPrompt}
									onKeyDown={e => {
										if (e.key === 'Enter') {
											e.preventDefault()
											if (connected)
												socket.send('parameters', {
													diffusion: { prompt: currentPrompt },
													override: true,
												})
										} else if (e.key === 'Escape') {
											setCurrentPrompt(diffusion.prompt)
										}
									}}
								/>
								{/* <textarea name='negative_prompt' value={diffusion.negative_prompt} placeholder='Negative prompt' onChange={onText} /> */}
							</div>
						</div>
						<div className={styles.rsep} />
						<div className={styles.row} data-4>
							<div className={styles.field}>
								<label>Flip X</label>
								<Toggle name='flip_x' value={transform.flip_x} onChange={onTransformParameterChange} />
							</div>
							<div className={styles.field}>
								<label>Flip Y</label>
								<Toggle name='flip_y' value={transform.flip_y} onChange={onTransformParameterChange} />
							</div>
							<div className={styles.field}>
								<label>Invert</label>
								<Toggle name='invert' value={filter.invert || 0} onChange={onInvert} />
							</div>
							<div className={styles.field}>
								<label>Stop</label>
								<Toggle name='freeze' value={freeze} onChange={onClientParameterChange} />
							</div>
						</div>
						<div className={styles.rsep} />
						<div className={styles.row}>{[filterDivs[0], filterDivs[1]]}</div>
						<div className={styles.row}>{[filterDivs[2], filterDivs[3]]}</div>
						<div className={styles.row}>{[filterDivs[4], filterDivs[5]]}</div>
						<div className={styles.rsep} />
						<div className={styles.row}>
							<Range
								name='transition_duration'
								label='Transition'
								value={transition_duration}
								onChange={onClientParameterChange}
								min={0}
								max={10}
								step={1}
								initial={defaultState.parameters.transition_duration}
							/>
						</div>
						<div className={styles.rsep} />
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
					</div>
					{show_cuelist && (
						<div className={styles.column}>
							<CueList />
						</div>
					)}
				</main>
				<div className={styles.version}>{VERSION}</div>
			</div>
		</FocusLock>
	)
}

export default memo(Panel)
