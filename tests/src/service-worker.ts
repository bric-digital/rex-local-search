// @ts-nocheck

// Implements the necessary functionality to load the REX modules into the 
// extension background service worker context.

import rexCorePlugin from '@bric/rex-core/service-worker'
import rexLocalSearchPlugin from '@bric/rex-local-search/service-worker'

console.log(`Imported ${rexCorePlugin} into service worker context...`)
console.log(`Imported ${rexLocalSearchPlugin} into service worker context...`)

self['rexCorePlugin'] = rexCorePlugin
self['rexLocalSearchPlugin'] = rexLocalSearchPlugin

rexCorePlugin.setup()
