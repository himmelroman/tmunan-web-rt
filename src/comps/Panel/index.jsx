/**
 *
 * Panel
 *
 */
import { memo, useEffect, useState } from 'react'
import { MdClose, MdFullscreen, MdFullscreenExit, MdInput, MdOutput, MdRefresh, MdReorder } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

// import { NAME } from '~/lib/constants'
import { FILTER_LIST, NAME } from '~/lib/constants'
import logger from '~/lib/logger'
import { setFilter, selectApp, setCamera, setTransform, setFPS, setShowClients, setShowOutput, setShowPanel, setShowSource } from '~/lib/redux'
import socket from '~/lib/socket'
import useClasses from '~/lib/useClasses'
import Range from '../Range'
import Select from '../Select'
import Toggle from '../Toggle'
import styles from './index.module.scss'
import Check from '../Check'

function debounce(func, timeout = 300) {
	let timer
	return (...args) => {
		clearTimeout(timer)
		timer = setTimeout(() => {
			func.apply(this, args)
		}, timeout)
	}
}

const debouncedSend = debounce(socket.send, 500)

const Panel = () => {
	const dispatch = useDispatch()

	const { fps, camera, transform, filter, cameras, connected, active, show_clients, show_source, show_output, presence } = useSelector(selectApp)

	const { parameters, connections, active_connection_name } = presence

	const [prompt, setPrompt] = useState('')
	const [negativePrompt, setNegativePrompt] = useState('')

	const onNewChange = (value, name) => {
		socket.send('set_parameters', { [name]: Number(value), override: true })
	}

	const onText = e => {
		e.stopPropagation()
		const { name, value } = e.target
		if (name === 'prompt') setPrompt(value)
		else setNegativePrompt(value)
		localStorage.setItem(name, value)
		if (connected) debouncedSend('set_parameters', { [name]: value, override: true })
	}

	useEffect(() => {
		setPrompt(parameters.prompt)
		setNegativePrompt(parameters.negative)
	}, [parameters])

	const onFPS = value => {
		dispatch(setFPS(value))
	}

	const onCamera = value => {
		dispatch(setCamera(value))
	}

	const onSource = value => {
		dispatch(setShowSource(value))
	}

	const onOutput = value => {
		dispatch(setShowOutput(value))
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

	useEffect(() => {
		window.addEventListener('pointerdown', outsideClick)
		return () => {
			window.removeEventListener('pointerdown', outsideClick)
		}
	}, [])

	const onConnectionClick = e => {
		const { name } = e.target.closest(`.${styles.connection}`).dataset
		logger.info('set active name', name)
		socket.send('set_active_name', { name })
	}

	const cls = useClasses(styles.cont, connected && styles.connected, active && styles.active)

	const ranges = FILTER_LIST.map(f => (
		<Range key={f.name} name={f.name} label={f.label} value={f.name in filter ? filter[f.name] : f.default} onChange={onFilterChange} min={f.min} max={f.max} step={f.step} initial={f.default} />
	))

	return (
		<div className={cls}>
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
				<button onClick={() => dispatch(setShowClients(show_clients ? false : true))}>
					<MdReorder />
				</button>
				<Check value={show_source} onChange={onSource}>
					<MdInput />
				</Check>
				<Check value={show_output} onChange={onOutput}>
					<MdOutput />
				</Check>
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
							<Select className={styles.select} name='camera' itemToString={a => window.cmap[a]} itemToValue={a => a} options={cameras} value={camera} onChange={onCamera} />
						</div>
					</div>
					<div className={styles.row}>
						<Range name='strength' label='Strength' value={parameters.strength} onChange={onNewChange} min={1} max={3} step={0.01} />
						<Range name='guidance_scale' label='Guidance' value={parameters.guidance_scale} onChange={onNewChange} min={0} max={1} step={0.01} />
					</div>
					<div className={styles.row}>
						<Range name='seed' label='Seed' value={parameters.seed} onChange={onNewChange} min={0} max={30} step={1} />
						<Range name='fps' label='FPS' value={fps} onChange={onFPS} min={1} max={30} step={1} />
					</div>
					<div className={`${styles.row} ${styles.prompt}`} data-1>
						<div className={styles.col}>
							<textarea name='prompt' value={prompt} placeholder='Prompt' onChange={onText} />
							<textarea name='negative_prompt' value={negativePrompt} placeholder='Negative prompt' onChange={onText} />
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
					</div>
					<div className={styles.row}>{[ranges[0], ranges[1]]}</div>
					<div className={styles.row}>{[ranges[2], ranges[3]]}</div>
					<div className={styles.row}>{[ranges[4], ranges[5]]}</div>
				</section>
				{show_clients && (
					<section>
						{/* <div className={styles.heading}>Connections</div> */}
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
					</section>
				)}
			</main>
		</div>
	)
}

export default memo(Panel)
