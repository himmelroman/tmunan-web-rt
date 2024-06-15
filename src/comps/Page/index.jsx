/**
 *
 * Template
 *
 */
import styles from './index.module.scss'

import { useState, useEffect } from 'react'
import { PipelineMode } from './types'
import ImagePlayer from './components/ImagePlayer'
import VideoInput from './components/VideoInput'
import Button from './components/Button'
import PipelineOptions from './components/PipelineOptions'
import Spinner from './icons/spinner'
import Warning from './components/Warning'
import { lcmLiveStatus, lcmLiveActions, LCMLiveStatus } from './lcmLive'
import { mediaStreamActions, onFrameChangeStore } from './mediaStream'
import { getPipelineValues, deboucedPipelineValues } from './store'
import { HOST, PORT } from './constants'

const App = () => {
	const [pipelineParams, setPipelineParams] = useState(null)
	const [pipelineInfo, setPipelineInfo] = useState(null)
	const [pageContent, setPageContent] = useState('')
	const [isImageMode, setIsImageMode] = useState(false)
	const [maxQueueSize, setMaxQueueSize] = useState(0)
	const [currentQueueSize, setCurrentQueueSize] = useState(0)
	const [queueCheckerRunning, setQueueCheckerRunning] = useState(false)
	const [warningMessage, setWarningMessage] = useState('')
	const [disabled, setDisabled] = useState(false)
	const [isLCMRunning, setIsLCMRunning] = useState(false)

	useEffect(() => {
		getSettings()
	}, [])

	const getSettings = async () => {
		const settings = await fetch(`http://${HOST}:${PORT}/api/settings`).then(r => r.json())
		setPipelineParams(settings.input_params.properties)
		setPipelineInfo(settings.info.properties)
		setIsImageMode(settings.info.properties.input_mode.default === PipelineMode.IMAGE)
		setMaxQueueSize(settings.max_queue_size)
		setPageContent(settings.page_content)
		toggleQueueChecker(true)
	}

	const toggleQueueChecker = start => {
		setQueueCheckerRunning(start && maxQueueSize > 0)
		if (start) {
			getQueueSize()
		}
	}

	const getQueueSize = async () => {
		if (!queueCheckerRunning) {
			return
		}
		const data = await fetch('/api/queue').then(r => r.json())
		setCurrentQueueSize(data.queue_size)
		setTimeout(getQueueSize, 10000)
	}

	const getSreamdata = () => {
		if (isImageMode) {
			return [getPipelineValues(), onFrameChangeStore?.blob]
		} else {
			return [deboucedPipelineValues]
		}
	}

	useEffect(() => {
		setIsLCMRunning(lcmLiveStatus !== LCMLiveStatus.DISCONNECTED)
		if (lcmLiveStatus === LCMLiveStatus.TIMEOUT) {
			setWarningMessage('Session timed out. Please try again.')
		}
	}, [lcmLiveStatus])

	const toggleLcmLive = async () => {
		try {
			if (!isLCMRunning) {
				if (isImageMode) {
					await mediaStreamActions.enumerateDevices()
					await mediaStreamActions.start()
				}
				setDisabled(true)
				await lcmLiveActions.start(getSreamdata)
				setDisabled(false)
				toggleQueueChecker(false)
			} else {
				if (isImageMode) {
					mediaStreamActions.stop()
				}
				lcmLiveActions.stop()
				toggleQueueChecker(true)
			}
		} catch (e) {
			setWarningMessage(e instanceof Error ? e.message : '')
			setDisabled(false)
			toggleQueueChecker(true)
		}
	}

	return (
		<>
			<Warning message={warningMessage} />

			<div className='container mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4'>
				<article className='text-center'>
					{pageContent && <div dangerouslySetInnerHTML={{ __html: pageContent }} />}

					{maxQueueSize > 0 && (
						<p className='text-sm'>
							There are{' '}
							<span id='queue_size' className='font-bold'>
								{currentQueueSize}
							</span>{' '}
							user(s) sharing the same GPU, affecting real-time performance. Maximum queue size is {maxQueueSize}.
							<a href='https://huggingface.co/spaces/radames/Real-Time-Latent-Consistency-Model?duplicate=true' target='_blank' className='text-blue-500 underline hover:no-underline'>
								Duplicate
							</a>{' '}
							and run it on your own GPU.
						</p>
					)}
				</article>

				{pipelineParams && (
					<article className='my-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
						{isImageMode && (
							<div className='sm:col-start-1'>
								<VideoInput width={Number(pipelineParams.width.default)} height={Number(pipelineParams.height.default)} />
							</div>
						)}
						<div className={isImageMode ? 'sm:col-start-2' : 'col-span-2'}>
							<ImagePlayer />
						</div>
						<div className='sm:col-span-2'>
							<Button onClick={toggleLcmLive} disabled={disabled} className={'text-lg my-1 p-2'}>
								{isLCMRunning ? 'Stop' : 'Start'}
							</Button>
							<PipelineOptions pipelineParams={pipelineParams} />
						</div>
					</article>
				)}

				{!pipelineParams && (
					<div className='flex items-center justify-center gap-3 py-48 text-2xl'>
						<Spinner className={'animate-spin opacity-50'} />
						<p>Loading...</p>
					</div>
				)}
			</div>
		</>
	)
}

export default App
