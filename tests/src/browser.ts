import rexLocalSearchPlugin from '@bric/rex-local-search/browser'

console.log(`Imported ${rexLocalSearchPlugin} into the browser context for ${window.location.href}...`)

self['rexLocalSearchPlugin'] = rexLocalSearchPlugin
