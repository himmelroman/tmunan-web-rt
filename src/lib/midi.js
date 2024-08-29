import { WebMidi } from 'webmidi'
import chalk from 'chalk'
import logger from './logger'

if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
	logger.warn('iOS detected, disabling WebMidi')
} else {
	WebMidi.enable()
		.then(() => {
			logger.info(chalk.greenBright('WebMidi enabled'))
			logger.info(
				'MIDI Inputs',
				WebMidi.inputs.map(i => i.name)
			)
			logger.info(
				'MIDI Outputs',
				WebMidi.outputs.map(o => o.name)
			)
		})
		.catch(err => logger.error(err))
}
