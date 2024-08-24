import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision'

class Segmenter {
	imageSegmenter
	lastWebcamTime
	_source
	ctx
	_running = false

	x
	y
	width
	height

	constructor(source, ctx) {
		console.log('Segmenter constructor')
		this._source = source
		this.ctx = ctx

		this.createImageSegmenter = this.createImageSegmenter.bind(this)
		this.callbackForVideo = this.callbackForVideo.bind(this)
		this.predictWebcam = this.predictWebcam.bind(this)

		this.createImageSegmenter()
	}

	async createImageSegmenter() {
		const vision = await FilesetResolver.forVisionTasks(
			'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
		)

		this.imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
			baseOptions: {
				modelAssetPath: '/models/selfie_segmenter_landscape.tflite',
				delegate: 'GPU',
			},
			outputCategoryMask: true,
			outputConfidenceMasks: true,
			runningMode: 'VIDEO',
		})
	}

	async predictWebcam() {
		if (this._source.currentTime === this.lastWebcamTime) {
			if (this._running === true) {
				window.requestAnimationFrame(this.predictWebcam)
			}
			return
		}
		this.lastWebcamTime = this._source.currentTime

		// draw original vide
		this.ctx.drawImage(this._source, 0, 0)
		// Do not segmented if imageSegmenter hasn't loaded
		if (this.imageSegmenter === undefined) {
			return
		}

		let startTimeMs = performance.now()

		// Start segmenting the stream.
		this.imageSegmenter.segmentForVideo(this._source, startTimeMs, this.callbackForVideo)
	}

	callbackForVideo(result) {
		let imageData = this.ctx.getImageData(0, 0, this._source.videoWidth, this._source.videoHeight).data
		const catMask = result.categoryMask.getAsFloat32Array()
		const confMask = result.confidenceMasks[0].getAsFloat32Array()
		let j = 0
		for (let i = 0; i < catMask.length; ++i) {
			const catMaskVal = Math.round(catMask[i] * 255.0)
			const confMaskVal = Math.round(confMask[i] * 255.0)
			// const legendColor = legendColors[maskVal % legendColors.length]
			if (catMaskVal > 100) imageData[j] = catMaskVal // (maskVal + imageData[j]) / 2
			// imageData[j + 1] = (maskVal + imageData[j + 1]) / 2
			// imageData[j + 2] = (confMaskVal + imageData[j + 2]) / 2
			// imageData[j + 3] = (maskVal + imageData[j + 3]) / 2
			j += 4
		}
		const uint8Array = new Uint8ClampedArray(imageData.buffer)
		const dataNew = new ImageData(uint8Array, this._source.videoWidth, this._source.videoHeight)
		this.ctx.putImageData(dataNew, 0, 0)
		if (this._running === true) {
			window.requestAnimationFrame(this.predictWebcam)
		}
	}

	get running() {
		return this._running
	}

	set running(value) {
		if (value === this._running) return
		console.log('setting running', value)
		this._running = value
		if (this._running === true) {
			// this.measureRegion()
			this.predictWebcam()
		}
	}

	get source() {
		return this._source
	}

	set source(value) {
		console.log('setting source', value)
		this._source = value
	}
}

export default Segmenter
