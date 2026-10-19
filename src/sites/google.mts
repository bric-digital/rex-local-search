import { LocalSearchSite } from '../types.mjs'

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

  detectLocalWidgets():Promise<void> {
    return new Promise((resolve) => {
      console.log('[rex-local-search:google] Detecting local search widgets...')

      // 0. Find rex-navigation

      let foundNavigation:boolean = false

      for (const element of document.querySelectorAll('div[role="navigation"]')) {
        if (foundNavigation === false) {
          element.parentElement?.classList.add('rex-local-search-navigation')
          element.parentElement?.setAttribute('title', 'rex-local-search-navigation')
          foundNavigation = true
        }
      }

      let widgetsFound:number = 0

      // 1. Find rex-local-search-widget

      for (const element of document.querySelectorAll('div[aria-label*=" Location results for "]')) {
        let hveidCount = 2

        let containerElement:HTMLElement|null = (element as HTMLElement)

        while (hveidCount > 0 && containerElement !== null && containerElement.tagName.toLowerCase() !== 'body') {
          if (containerElement.getAttribute('data-hveid') !== null) {
            hveidCount -= 1
          }

          if (hveidCount === 0) {
            break
          } else {
            containerElement = containerElement.parentElement
          }
        }
      
        if (containerElement !== null && containerElement.tagName.toLowerCase() !== 'body') {
          console.log('[rex-local-search:google] Found Local Search element.')
          containerElement.classList.add('rex-local-search-widget')
          widgetsFound += 1
        }
      }

      if (widgetsFound === 0) {
        for (const element of document.getElementsByTagName('h2')) {
          if (['Local Search', 'Local Results'].includes(element.textContent)) {
            console.log('[rex-local-search:google] Found Local Search element.')

            let containerElement:HTMLElement|null = (element as HTMLElement)

            while (containerElement !== null && containerElement.tagName.toLowerCase() !== 'body') {
              if (containerElement.getAttribute('data-rpos') !== null) {
                  containerElement.classList.add('rex-local-search-widget')
                  widgetsFound += 1

                  break
              }

              containerElement = containerElement.parentElement
            }
          }
        }
      }

      for (const widgetElement of document.querySelectorAll('.rex-local-search-widget')) {
        // 2. Find local-search-widget-map 

        console.log('[rex-local-search:google] Detecting local search widget map...')

        for (const element of widgetElement.getElementsByTagName('h3')) {
          if (['Map'].includes(element.textContent.trim())) {
            console.log('[rex-local-search:google] Found Local Search Map element.')

            element.parentElement?.classList.add('rex-local-search-widget-map')
          }
        }

        // 3. Find rex-local-search-widget-row 

        console.log('[rex-local-search:google] Detecting local search widget rows...')

        for (const rowElement of widgetElement.querySelectorAll('[data-record-click-time]')) {
          rowElement.classList.add('rex-local-search-widget-row')
        }
      }

      for (const resultRowElement of document.querySelectorAll('[data-rpos]')) {
        if (resultRowElement.classList.contains('rex-local-search-widget') === false) {
          resultRowElement.classList.add('rex-local-search-result')
        }
      }

      resolve()
    })
  }

  collapseElement(element:HTMLElement) {
    console.log('[rex-local-search:google] collapseElement')

    const matches = document.querySelectorAll('.rex-local-search-result')

    console.log(`[rex-local-search:google] ${matches.length}`)

    if (matches.length > 0) {
      const firstParent = (matches[0] as HTMLElement).parentElement

      if (firstParent !== null) {
        console.log(`[rex-local-search:google] have first parent`)
        const clonedElement:HTMLElement = firstParent.cloneNode(true) as HTMLElement

        const h3s = clonedElement.querySelectorAll('h3')

        for (const h3 of h3s) {
          console.log(`[rex-local-search:google] Found title`)

          h3.innerText = 'TODO: Mirror widget title'
        }

        const descs = clonedElement.querySelectorAll('[data-sncf="1"]')

        for (const desc of descs) {
          (desc as HTMLElement).innerText = 'TODO: Generate / mirror search result text'

          console.log(`[rex-local-search:google] Found description`)
        }

        firstParent.before(clonedElement)

        const noTrans = clonedElement.querySelectorAll('.notranslate')

        for (const noTran of noTrans) {
          for (const cite of noTran.querySelectorAll('cite')) {
            console.log(`[rex-local-search:google] Found breadcrumb`)

            cite.innerText = 'TODO: URL breadcrumb'
          }

          const pageImgs = clonedElement.querySelectorAll('img[data-csiid]')

          for (const pageImg of pageImgs) { // TODO: Replace with generic site icon
            console.log(`[rex-local-search:google] Found page icon`)

            const imgElement = pageImg as HTMLElement

            imgElement.style.backgroundColor = '#808080'

            imgElement.removeAttribute('data-csiid')
          }
        }

        const svgs = clonedElement.querySelectorAll('svg')

        for (const svg of svgs) { // Hide any embedded SVG buttons...
          console.log(`[rex-local-search:google] Found button to hide`)
          svg.style.display = 'none'
        }

        const pageImgs = clonedElement.querySelectorAll('img[data-csiid]')

        for (const pageImg of pageImgs) {
          (pageImg as HTMLElement).style.display = 'none'

          console.log(`[rex-local-search:google] Found page thumbnail`)
        }

        let collapseUrl:string = ''


        for (const aHref of document.querySelectorAll('.rex-local-search-widget a')) {
          const href = aHref.getAttribute('href')

          if (collapseUrl === '' && href?.startsWith('/search?')) {
            collapseUrl = href
          }
        }

        for (const aHref of clonedElement.querySelectorAll('a')) {
          aHref.setAttribute('href', collapseUrl)
        }

        firstParent.before(clonedElement)
      }
    }

    super.collapseElement(element)
  }
}
