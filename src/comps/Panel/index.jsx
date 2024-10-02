/**
 *
 * Panel
 *
 */
import { getProperty } from 'dot-prop'
import { memo, useEffect, useMemo, useState } from 'react'
import { MdPhotoCamera, MdTune } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { CAMERA_PROPS, DIFFUSION_RANGES, FILTER_RANGES, NAME, PARAMETER_SCHEMA } from '~/lib/constants'
import {
	onClientParameterChange,
	onDiffusionParameterChange,
	onFilterParameterChange,
	onLocalChange,
	onTransformParameterChange,
	parameterCallbacks,
} from '~/lib/handlers'
import logger from '~/lib/logger'
import store, {
	addCue,
	defaultState,
	saveCue,
	selectApp,
	selectConnected,
	setCameraSetting,
	setFilter,
	setLocalProp,
} from '~/lib/redux'
import socket from '~/lib/socket'
import { loadAndSendCue } from '~/lib/thunks'
import { camelToFlat } from '~/lib/utils'
import Range from '../Range'
import Select from '../Select'
import Toggle from '../Toggle'
import styles from './index.module.scss'

const onInvert = value => {
	const s = store.getState()
	const invert = value ? 1 : 0
	if (invert === s.app.parameters.client.filter.invert) return

	store.dispatch(setFilter({ invert }))
	const connected = selectConnected(s)
	if (connected) socket.send('parameters', { client: { filter: { invert } }, override: true })
}

const incrementRange = (app, inc) => {
	const ar = app.active_range
	const schema = PARAMETER_SCHEMA[ar]
	const value = getProperty(app, schema.path)
	const step = schema.natural_step || schema.step

	let newValue = value
	if (inc) newValue += step
	else newValue -= step

	newValue = Math.round(Math.min(Math.max(newValue, schema.min), schema.max) * 100) / 100
	parameterCallbacks[schema.parameter_type](newValue, ar)
}

const onWheel = e => {
	if (e.ctrlKey) {
		e.preventDefault()
		return
	}
	const { app } = store.getState()
	if (app.active_range) {
		e.preventDefault()
		incrementRange(app, e.deltaY < 0)
	}
}

const onKeyDown = e => {
	const { code, ctrlKey } = e
	const { app } = store.getState()
	if (app.active_range && (code === 'ArrowUp' || code === 'ArrowDown')) {
		e.preventDefault()
		e.stopPropagation()
		incrementRange(app, code === 'ArrowUp')
		return
	}

	if (ctrlKey) {
		if (e.code.includes('Digit')) {
			e.preventDefault()
			const digit = parseInt(e.code.match(/\d+/))
			if (digit >= app.cameras.length) return
			store.dispatch(setLocalProp(['camera', app.cameras[digit]]))
			return
		}

		if (code === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			store.dispatch(addCue())
		}

		return
	}

	switch (code) {
		case 'Enter':
			if (e.shiftKey) store.dispatch(saveCue())
			break
		case 'BracketLeft':
			store.dispatch(loadAndSendCue(app.cue_index - 1))
			break
		case 'BracketRight':
			store.dispatch(loadAndSendCue(app.cue_index + 1))
			break
		default:
			break
	}

	if (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type === 'text')) return

	switch (code) {
		case 'KeyN':
			e.preventDefault()
			const name_input = document.getElementById('cue_name_input')
			name_input.focus()
			break
		case 'KeyI':
			onInvert(app.parameters.client.filter.invert ? 0 : 1)
			break
		case 'KeyX':
			onTransformParameterChange(app.parameters.client.transform.flip_x ? 0 : 1, 'flip_x')
			break
		case 'KeyY':
			onTransformParameterChange(app.parameters.client.transform.flip_y ? 0 : 1, 'flip_y')
			break
		default:
			break
	}
}

// Component

const Panel = () => {
	const dispatch = useDispatch()

	const app = useSelector(selectApp)

	const { camera, cameras, camera_settings, presence, active_range } = app
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
		const { _, value } = e.target
		setCurrentPrompt(value)
	}

	// const outsideClick = e => {
	// 	if (e.target.closest(`.${styles.cont}`)) return
	// 	dispatch(setShowUI(false))
	// }

	const onConnectionClick = e => {
		const { name } = e.target.closest(`.${styles.connection}`).dataset
		logger.info('set active name', name)
		socket.send('set_active_name', { name })
	}

	useEffect(() => {
		// if (!IS_CONTROL) window.addEventListener('pointerdown', outsideClick)
		window.addEventListener('keydown', onKeyDown, true)
		window.addEventListener('wheel', onWheel, { passive: false })

		return () => {
			// if (!IS_CONTROL) window.removeEventListener('pointerdown', outsideClick)
			window.removeEventListener('keydown', onKeyDown, true)
			window.removeEventListener('wheel', onWheel)
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
			value={filter[f.name]}
			onChange={onFilterParameterChange}
			min={f.min}
			max={f.max}
			step={f.step}
			natural_step={f.natural_step}
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
			natural_step={f.natural_step}
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

	return (
		<div className={styles.cont}>
			<div className='column'>
				<div id='camera-field' className={styles.camera_field} data-expanded={camExpanded || null}>
					<div className={styles.header}>
						<Select
							className={styles.camera_select}
							name='camera'
							itemToString={a => window.cmap[a]}
							itemToValue={a => a}
							options={cameras}
							value={camera}
							onChange={onLocalChange}
						>
							<MdPhotoCamera className={styles.camera_icon} />
						</Select>
						<button
							className={styles.camera_settings_button}
							data-active={camera_settings || null}
							onClick={() => setCameExpanded(!camExpanded)}
						>
							<MdTune />
						</button>
					</div>
					<div id='camera-wrap' className={styles.wrap}>
						{cameraSettingsDiv}
					</div>
				</div>
				<div className={styles.row}>{[diffusionDivs[0], diffusionDivs[1]]}</div>
				<div className={styles.row}>
					{diffusionDivs[2]}
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
							onKeyUp={e => {
								if ('[]'.includes(e.key)) {
									e.preventDefault()
									return
								}
								if (e.key === 'Enter') {
									e.preventDefault()
									if (promptChanged) onDiffusionParameterChange(currentPrompt, 'prompt')
								} else if (e.key === 'Escape') {
									if (promptChanged) setCurrentPrompt(diffusion.prompt)
									else e.target.blur()
								}
							}}
						/>
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
				<div className={styles.row}>
					<Range
						name='zoom'
						label='Zoom'
						value={1}
						// onChange={onClientParameterChange}
						min={1}
						max={10}
						natural_step={1}
						step={0.1}
						initial={1}
					/>
					<Range
						name='transition_duration'
						label='Transition'
						value={transition_duration}
						onChange={onClientParameterChange}
						min={0}
						max={10}
						natural_step={1}
						step={0.1}
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
		</div>
	)
}

export default memo(Panel)
