import { REXConfiguration } from '@bric/rex-core/common'
import { REXClientModule, registerREXModule, injectREXSelectors } from '@bric/rex-core/browser'

import { REXLocalSearchConfiguration, REXLocalSearchSiteConfiguration, LocalSearchSite } from './types.mjs'
import { GoogleLocalSite } from './sites/google.mjs'

class LocalSearchModule extends REXClientModule {
  configuration?:REXLocalSearchConfiguration
  debug:boolean = false

  sites:LocalSearchSite[] = []

  constructor() {
    super()

    this.sites.push(new GoogleLocalSite())
  }

  toString():string {
    return 'LocalSearchModule'
  }

  setup() {
    for (const site of this.sites) {
      site.preparePage()
    }

    chrome.runtime.sendMessage({
      'messageType': 'fetchConfiguration',
    }).then((response:{ [name: string]: any; }) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const configuration = response as REXConfiguration

      this.configuration = ((configuration as any)['local_search'] as REXLocalSearchConfiguration) // eslint-disable-line @typescript-eslint/no-explicit-any

      if (this.debug) {
        console.log(`[rex-local-search] Got config...`)
        console.log(this.configuration)
      }

      if (this.configuration !== undefined) {
        const defaultConfig = this.configuration.sites['default']

        for (const site of this.sites) {
          const config:REXLocalSearchSiteConfiguration = {
            id: 'default'
          }
 
          if (defaultConfig !== undefined) {
            Object.assign(config, defaultConfig)
          }

          const siteConfig = this.configuration.sites[site.identifier()]

          if (siteConfig !== undefined) {
            Object.assign(config, siteConfig)
          }

          site.detectElements(config)
       }
      }
    })


    // new MutationObserver((mutationList, observer) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    //   // console.log(`[rex-local-search] Mutation: ${observer}`)
    //   // console.log(mutationList)
      
    //   if (this.refreshTimeout == 0) {
    //     this.refreshTimeout = window.setTimeout(() => {
    //       this.applyConfiguration()

    //       this.refreshTimeout = 0
    //     }, 250)
    //   }
    // }).observe(document, {subtree: true, childList: true})
  }
}

const plugin = new LocalSearchModule()

registerREXModule(plugin)

export default plugin
