export const camelToFlat = (camel, title = false) => {
	let arr = camel.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ')
	arr = arr.map(word => (title ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase()))
	return arr.join(' ')
}

export const copy = obj => JSON.parse(JSON.stringify(obj))

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
