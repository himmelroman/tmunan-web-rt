import { useMemo } from 'react'

const useClasses = (...classValues) => {
	const classes = useMemo(() => {
		const arr = []
		if (!classValues || !classValues.length) return null
		for (let i = 0; i < classValues.length; i++) {
			let a = classValues[i]
			if (!a) continue
			if (Array.isArray(a)) {
				classValues.splice(i + 1, 0, ...a)
				continue
			}
			if (typeof a !== 'string') {
				if (typeof a === 'object' && 'className' in a) a = a.className
				else continue
			}
			a = a.trim()
			if (a === 'false' || a === 'undefined') continue
			if (!a.length) continue
			if (a.includes(' ')) {
				classValues.splice(i + 1, 0, ...a.split(' '))
				continue
			}
			arr.push(a)
		}
		return arr.join(' ')
	}, [...classValues])

	return classes
}

export default useClasses
