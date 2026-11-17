import { LocalSearchSite } from '../types.mjs'

const PREVIEW_MIN_WIDTH = 48

const MAP_PIN_ICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ea4335"/><path fill="#ffffff" transform="translate(3.6 3.6) scale(0.7)" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>')

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

    const matches = document.querySelectorAll('.rex-local-search-result:has(h3):has([data-sncf="1"])')

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

        this.replaceImages(firstParent, clonedElement, element)

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

        const resultList = firstParent.parentElement

        if (resultList !== null && resultList.contains(element) === false) {
          resultList.prepend(clonedElement)
        } else {
          element.before(clonedElement)
        }
      }
    }

    super.collapseElement(element)
  }

  replaceImages(original:HTMLElement, copy:HTMLElement, localPack:HTMLElement) {
    const mapImage = localPack.querySelector<HTMLImageElement>('.rex-local-search-widget-map img')
    const copiedImages = copy.querySelectorAll('img')

    original.querySelectorAll('img').forEach((originalImage, index) => {
      const copiedImage = copiedImages[index]

      copiedImage.removeAttribute('srcset')

      if (originalImage.getBoundingClientRect().width < PREVIEW_MIN_WIDTH) {
        copiedImage.src = MAP_PIN_ICON
      } else if (mapImage !== null) {
        copiedImage.src = mapImage.src
        copiedImage.style.objectFit = 'cover'
      } else {
        copiedImage.style.display = 'none'
      }
    })
  }
}
