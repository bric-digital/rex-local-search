// "local_search": {
//   "enabled": true,
//   "debug": true,
//   "sites": {
//     "google": {
//       "id": "google",
//       "initial_obscure": true,
//       "styles": {
//         "rex-local-search-result": "border: solid red 2px;",
//         "rex-local-search-widget": "border: solid orange 2px;",
//         "rex-local-search-widget-row": "border: solid blue 2px;",
//         "rex-local-search-widget-map": "border: solid black 2px;",
//         "rex-local-search-detail-widget": "border: dashed red 2px;",
//         "rex-local-search-ai-widget": "border: dotted red 2px;",
//         "rex-local-search-ai-widget-row": "border: dotted red 2px;",
//         "rex-local-search-ai-widget-map": "border: dotted red 2px;"
//       },
//       "manipulations": {
//         "rex-local-search-result": {
//           "operation": "collapse"
//         }, "rex-local-search-ai-widget": {
//           "operation": "hide"
//         }
//       }
//     }
//   }
// },

export interface REXLocalSearchSiteManipulationConfiguration {
  operation:'collapse'|'hide'
  title?:string
}

export interface REXLocalSearchSiteStyleConfiguration {
  [cssClass:string]: string;
}

export interface REXLocalSearchSiteConfiguration {
  id: string,
  initial_obscure?: boolean,
  styles?: REXLocalSearchSiteStyleConfiguration,
  manipulations?:{[cssClass:string]: REXLocalSearchSiteManipulationConfiguration},
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

      this.detectLocalWidgets().then(() => {
        console.log(`[rex-local-search] Widgets detected.`)

        this.applyManipulations(config).then(() => {
          console.log(`[rex-local-search] Manipulations applied.`)
        })
      })
    }
  }

  preparePage() {
    throw new Error('Implement preparePage in subclasses.')
  }

  detectLocalWidgets():Promise<void> {
    return new Promise((resolve) => {
      resolve()
    })
  }

  applyManipulations(config:REXLocalSearchSiteConfiguration|undefined):Promise<void> {
    return new Promise((resolve) => {
      if (config !== undefined && config.manipulations !== undefined) {
        for (const cssClass of Object.keys(config.manipulations)) {
          console.log(`[rex-local-search] manipulating = ${cssClass}`)

          const manipulation = config.manipulations[cssClass]

          console.log(`[rex-local-search] manipulation.operation = ${manipulation.operation}`)

          if (manipulation.operation === 'hide') {
            console.log(`[rex-local-search] hiding ${cssClass}`)

            const matches = document.querySelectorAll(`.${cssClass}`)

            for (const match of matches) {
              (match as HTMLElement).style.display = 'none'
            }
          } else if (manipulation.operation === 'collapse') {
            console.log(`[rex-local-search] collapsing ${cssClass}`)

            const matches = document.querySelectorAll(`.${cssClass}`)

            for (const match of matches) {
              this.collapseElement(match as HTMLElement, manipulation)
            }
          }
        }
      }

      resolve()
    })
  }

  collapseElement(element:HTMLElement, manipulation:REXLocalSearchSiteManipulationConfiguration) { // eslint-disable-line @typescript-eslint/no-unused-vars
    element.style.display = 'none'
  }
}