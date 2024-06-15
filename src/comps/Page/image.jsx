import { useEffect, useRef, useState } from 'react'

import Button from './Button'
import Floppy from './floppy'
import { snapImage } from './utils'

import { HOST, PORT } from './constants'
import { getPipelineValues } from './store'

const App = () => {
	const [isLCMRunning, setIsLCMRunning] = useState(false)
	const [streamId, setStreamId] = useState(null)
	const [imageEl, setImageEl] = useRef(null)

	useEffect(() => {
		setIsLCMRunning(lcmLiveStatus !== LCMLiveStatus.DISCONNECTED)
		console.log('isLCMRunning', isLCMRunning)
	}, [lcmLiveStatus])

	const takeSnapshot = async () => {
		if (isLCMRunning) {
			await snapImage(imageEl.current, {
				prompt: getPipelineValues()?.prompt,
				negative_prompt: getPipelineValues()?.negative_prompt,
				seed: getPipelineValues()?.seed,
				guidance_scale: getPipelineValues()?.guidance_scale,
			})
		}
	}

	return (
		<div className='relative mx-auto aspect-square max-w-lg self-center overflow-hidden rounded-lg border border-slate-300'>
			{isLCMRunning && streamId ? (
				<>
					<img ref={imageEl} className='aspect-square w-full rounded-lg' src={`http://${HOST}:${PORT}/api/stream/` + streamId} />
					<div className='absolute bottom-1 right-1'>
						<Button onClick={takeSnapshot} disabled={!isLCMRunning} title={'Take Snapshot'} className={'ml-auto rounded-lg p-1 text-sm text-white opacity-50 shadow-lg'}>
							<Floppy className={''} />
						</Button>
					</div>
				</>
			) : (
				<img className='aspect-square w-full rounded-lg' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' />
			)}
		</div>
	)
}

export default App
