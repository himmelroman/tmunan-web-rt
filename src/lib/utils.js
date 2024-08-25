export const camelToFlat = (camel, title = false) => {
	let arr = camel.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ')
	arr = arr.map(word => (title ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase()))
	return arr.join(' ')
}

export const copy = obj => JSON.parse(JSON.stringify(obj))
