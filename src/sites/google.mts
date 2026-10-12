import { LocalSearchSite, REXLocalSearchSiteConfiguration } from '../types.mjs'

export class GoogleLocalSite extends LocalSearchSite {
  name():string {
    return 'Google'
  }

  identifier():string {
    return 'google'
  }

  onLocalSite():boolean {
    if (window.top !== null && window.top.location.href.includes('google.com/search')) {
      return true
    }

    return false
  }

  preparePage() {

  }

  detectLocalWidgets() {
    console.log('[rex-local-search:google] Detecting local search widgets...')

    for (const element of document.getElementsByTagName('h2')) {
      if (element.textContent === 'Local Search') {
        if (element.parentElement !== null) {
          console.log('[rex-local-search:google] Found Local Search element.')
          element.parentElement.classList.add('rex-local-search-widget')

          if (element.parentElement.children !== undefined) {
            for (const childElement of element.parentElement.children) {
              if (childElement.tagName.toLowerCase() === 'h2') {
                // Skip
              } else if (childElement.attributes.getNamedItem('data-hveid') !== null) {
                console.log('[rex-local-search:google] Found Local Search map widget.')
                childElement.classList.add('rex-local-search-widget-map')
              } else {
                const styleAttr =  childElement.attributes.getNamedItem('style')

                if (styleAttr !== null && styleAttr.value === 'z-index:1') {
                  for (const containerElement of childElement.children) {
                    for (const rowElement of containerElement.children) {
                      if (rowElement.attributes.getNamedItem('jsdata') !== null) {
                        console.log('[rex-local-search:google] Found Local Search place row.')
                        rowElement.classList.add('rex-local-search-widget-row')
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    for (const element of document.getElementsByTagName('div')) {
      const ariaLabel = element.attributes.getNamedItem('aria-label')

      if (ariaLabel !== null && ariaLabel.value !== null) {
        console.log(`[rex-local-search:google] aria-label: ${ariaLabel.value}`)

        if (ariaLabel.value.includes(': Location results for')) {
          if (element.parentElement !== null) {
            console.log('[rex-local-search:google] Found Local Search element.')
            const localWidgetElement = element.parentElement.parentElement?.parentElement?.parentElement?.parentElement

            if (localWidgetElement !== null && localWidgetElement !== undefined) {
              localWidgetElement.classList.add('rex-local-search-widget')

              if (localWidgetElement.children !== undefined) {
                for (const childElement of localWidgetElement.children) {
                  if (childElement.attributes.getNamedItem('data-vstcp') !== null) {
                    for (const containerElement of childElement.children) {
                      for (const itemElement of containerElement.children) {
                        if (itemElement.attributes.getNamedItem('data-hveid') !== null) {
                          console.log('[rex-local-search:google] Found Local Search map widget.')
                          childElement.classList.add('rex-local-search-widget-map')
                        } else if (itemElement.attributes.getNamedItem('jsname') !== null) {
                          for (const itemContainerElement of itemElement.children) {
                            for (const itemBoxElement of itemContainerElement.children) {
                              const styleAttr =  itemBoxElement.attributes.getNamedItem('style')

                              if (styleAttr !== null && styleAttr.value === 'z-index:1') {
                                for (const boxContainerElement of itemBoxElement.children) {
                                  for (const boxRowElement of boxContainerElement.children) {
                                    if (boxRowElement.attributes.getNamedItem('jsdata') !== null) {
                                      console.log('[rex-local-search:google] Found Local Search place row.')
                                      boxRowElement.classList.add('rex-local-search-widget-row')
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      const rPos = element.attributes.getNamedItem('data-rpos')

      if (rPos !== null) {
        element.classList.add('rex-local-search-result')
      }

      const attrId = element.attributes.getNamedItem('data-attrid')

      if (attrId !== null && attrId.value === 'lab/cluster/title/Nearby places') {
        if (element.parentElement !== null) {
          console.log('[rex-local-search:google] Found Local Search element.')
          const localWidgetElement = element.parentElement.parentElement?.parentElement

          if (localWidgetElement !== null && localWidgetElement !== undefined) {
            localWidgetElement.classList.add('rex-local-search-widget')

            const matches = localWidgetElement.querySelectorAll('[data-record-click-time]')

            for (const match of matches) {
              match.classList.add('rex-local-search-widget-row')
            }

            const mapLabel = localWidgetElement.querySelectorAll('h3')

            for (const match of matches) {
              const matchElement = match as Element

              if (matchElement.innerHTML.trim() === 'Map') {
                matchElement.parentElement?.classList.add('rex-local-search-widget-map')
              }
            }
          }
        }
      }
    }
  }
}
