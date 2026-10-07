    // "local_search": {
    //   "enabled": true,
    //   "debug": true,
    //   "sites": [{
    //     "google": {
    //      "id": "google",
    //       "initial_obscure": true,
    //       "styles": {
    //         "rex-local-search-result": "border: solid red 4px;",
    //         "rex-local-search-widget": "border: solid orange 4px;",
    //         "rex-local-search-widget-row": "border: solid blue 4px;",
    //         "rex-local-search-widget-map": "border: solid black 4px;",
    //         "rex-local-search-detail-sidget": "border: dashed red 4px;",
    //        "rex-local-search-ai-widget": "border: dotted red 4px;",
    //         "rex-local-search-ai-widget-row": "border: dotted red 4px;",
    //         "rex-local-search-ai-widget-map": "border: dotted red 4px;",
    //        }
      //   }]
    // },

export interface REXLocalSearchSiteStyleConfiguration {
  [cssClass:string]: string;
}

export interface REXLocalSearchSiteConfiguration {
  id: string,
  initial_obscure?: boolean,
  styles?: REXLocalSearchSiteStyleConfiguration
}

export interface REXLocalSearchConfiguration {
  enabled: boolean,
  debug?: boolean,
  sites: {[key: string]: REXLocalSearchSiteConfiguration}
}

export class LocalSearchSite {
  config:REXLocalSearchSiteConfiguration|undefined = undefined

  constructor() {
    if (new.target === LocalSearchSite) {
      throw new Error('Cannot be instantiated')
    }
  }

  setup(config:REXLocalSearchSiteConfiguration) {
    this.config = config
  }

  name():string {
    return 'LocalSearchSite'
  }

  identifier():string {
    return 'implement-in-subclasses'
  }

  onLocalSite():boolean {
    return false
  }

  detectElements(config:REXLocalSearchSiteConfiguration|undefined) {
    if (this.onLocalSite() === false) {
      // Undo any obscuring or other pre-manipulation

      return
    }

    if (config !== undefined) {
      if (config.styles !== undefined) {
        const newStyleElement = document.createElement("style")
        document.head.appendChild(newStyleElement)

        const styleSheet = newStyleElement.sheet

        if (styleSheet !== null) {
          for (const className of Object.keys(config.styles)) {
          const cssString:string = `.${className} { ${config.styles[className]} }`
            styleSheet.insertRule(cssString)       
          }
        }
      }
    }

    this.detectLocalWidgets()
  }

  preparePage() {
    throw new Error('Implement preparePage in subclasses.')
  }

  detectLocalWidgets() {
    // Tag nothing by default
  }
}