export const camelToFlat = (camel, title = false) => {
	let arr = camel.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ')
	arr = arr.map(word => (title ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase()))
	return arr.join(' ')
}

export const copy = obj => JSON.parse(JSON.stringify(obj))

export const noop = a => a

/*
export const fromPrompt = s => {
	const { prompt } = s.parameters.diffusion
	if (!prompt?.length) return false
	const words = s.parameters.diffusion.prompt.split(' ')
	let name = words.slice(0, 2).join(' ')
	if (name.length > 40) {
		name = words[0]
	}
	return name
}
*/

/* export const onOpenCuelist = () => {
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
} */

/* export const onSaveCuelist = () => {
	const data = JSON.stringify({ cues, cue_index })
	const blob = new Blob([data], { type: 'application/json' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = `tmunan_${NAME}.json`
	a.click()
	URL.revokeObjectURL(url)
} */
