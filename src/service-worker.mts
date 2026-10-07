import check from 'check-types'

import { REXConfiguration } from '@bric/rex-core/common'

import rexCorePlugin, { REXServiceWorkerModule, registerREXModule } from '@bric/rex-core/service-worker'
import { REXLocalSearchConfiguration, REXLocalSearchSiteConfiguration } from './types.mjs'

class LocalSearchModule extends REXServiceWorkerModule {
  debug:boolean = false
  initialObscure:boolean = true

  constructor() {
    super()
  }

  moduleName() {
    return 'LocalSearchModule'
  }

  setup() {
    this.refreshConfiguration()
  }

  configurationDetails():any { // eslint-disable-line @typescript-eslint/no-explicit-any
    return "TODO"
  }

  refreshConfiguration() {
    rexCorePlugin.fetchConfiguration()
      .then((configuration:REXConfiguration) => {
        if (configuration !== undefined) {
          const localSearchConfig = ((configuration as any)['local_search'] as REXLocalSearchConfiguration) // eslint-disable-line @typescript-eslint/no-explicit-any

          if (this.debug) {
            console.log(`[rex-local-search] Configuration:`)
            console.log(localSearchConfig)
          }

          if (localSearchConfig !== undefined) {
            this.updateConfiguration(localSearchConfig)

            return
          }
        }

        setTimeout(() => {
          this.refreshConfiguration()
        }, 1000)
      })
  }

  updateConfiguration(config:REXLocalSearchConfiguration) {
    if (config.debug === true) {
      this.debug = true
    } else {
      this.debug = false
    }
  }

  handleMessage(message:any, sender:any, sendResponse:(response:any) => void):boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
    return false
  }
}

const plugin = new LocalSearchModule()

registerREXModule(plugin)

export default plugin
