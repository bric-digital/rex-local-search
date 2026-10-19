import { LocalSearchSite, REXLocalSearchSiteManipulationConfiguration } from '../types.mjs'

const DEFAULT_TITLE = 'Local results for {{query}}'

const PREVIEW_MIN_WIDTH = 48

const PREVIEW_SIZE = 92

const SITE_NAME = 'Google Places'

const BREADCRUMB_URL = 'https://www.google.com'

const BREADCRUMB_PATH = ' › Places'

const RATING_PATTERN = /^(\d(?:\.\d)?)\s*\(([^)]+)\)/

const DISTANCE_PATTERN = /^\d+(?:\.\d+)?\s*(?:mi|km|ft|m)$/

const YEARS_IN_BUSINESS_PATTERN = /years in business/i

interface LocalPlace {
  name:string
  rating?:string
  reviews?:string
  distance?:string
  address?:string
}

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

  collapseElement(element:HTMLElement, manipulation:REXLocalSearchSiteManipulationConfiguration) {
    console.log('[rex-local-search:google] collapseElement')

    const matches = document.querySelectorAll('.rex-local-search-result:has(h3):has([data-sncf="1"])')

    console.log(`[rex-local-search:google] ${matches.length}`)

    if (matches.length > 0) {
      const firstParent = (matches[0] as HTMLElement).parentElement

      if (firstParent !== null) {
        console.log(`[rex-local-search:google] have first parent`)
        const clonedElement:HTMLElement = firstParent.cloneNode(true) as HTMLElement

        const h3s = clonedElement.querySelectorAll('h3')
        const title = this.fillTemplate(manipulation.title ?? DEFAULT_TITLE)

        for (const h3 of h3s) {
          console.log(`[rex-local-search:google] Found title`)

          h3.innerText = title
        }

        const descs = clonedElement.querySelectorAll('[data-sncf="1"]')
        const description = this.describePlaces(element)

        for (const desc of descs) {
          (desc as HTMLElement).innerText = description

          console.log(`[rex-local-search:google] Found description`)
        }

        const noTrans = clonedElement.querySelectorAll('.notranslate')

        for (const noTran of noTrans) {
          for (const cite of noTran.querySelectorAll('cite')) {
            console.log(`[rex-local-search:google] Found breadcrumb`)

            this.replaceBreadcrumb(cite)
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
        this.replaceSiteName(clonedElement)

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

    super.collapseElement(element, manipulation)
  }

  fillTemplate(template:string):string {
    const values:{[token:string]: string} = {
      query: new URL(window.location.href).searchParams.get('q') ?? ''
    }

    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, token:string) => values[token] ?? '')
  }

  replaceImages(original:HTMLElement, copy:HTMLElement, localPack:HTMLElement) {
    const mapImage = localPack.querySelector<HTMLImageElement>('.rex-local-search-widget-map img')
    const copiedImages = copy.querySelectorAll('img')
    let previewShown = false

    original.querySelectorAll('img').forEach((originalImage, index) => {
      const copiedImage = copiedImages[index]

      copiedImage.removeAttribute('srcset')

      if (originalImage.getBoundingClientRect().width < PREVIEW_MIN_WIDTH) {
        copiedImage.src = MAP_PIN_ICON
      } else if (mapImage !== null) {
        copiedImage.src = mapImage.src
        copiedImage.style.objectFit = 'cover'
        previewShown = true
      } else {
        copiedImage.style.display = 'none'
      }
    })

    if (previewShown === false && mapImage !== null) {
      this.addPreview(copy, mapImage.src)
    }
  }

  addPreview(copy:HTMLElement, source:string) {
    const preview = document.createElement('img')

    preview.src = source
    preview.alt = ''
    preview.style.cssText = `position: absolute; top: 0; right: 0; width: ${PREVIEW_SIZE}px; height: ${PREVIEW_SIZE}px; object-fit: cover; border-radius: 8px;`

    copy.style.position = 'relative'
    copy.style.paddingRight = `${PREVIEW_SIZE + 16}px`
    copy.style.minHeight = `${PREVIEW_SIZE}px`

    copy.append(preview)
  }

  replaceSiteName(copy:HTMLElement) {
    for (const cite of copy.querySelectorAll('cite')) {
      let citeBlock:Element|null = cite

      while (citeBlock !== null && citeBlock !== copy && citeBlock.previousElementSibling === null) {
        citeBlock = citeBlock.parentElement
      }

      let siteName = citeBlock?.previousElementSibling ?? null

      while (siteName?.firstElementChild) {
        siteName = siteName.firstElementChild
      }

      if (siteName !== null && copy.contains(siteName)) {
        siteName.textContent = SITE_NAME
      }
    }
  }

  replaceBreadcrumb(cite:HTMLElement) {
    const path = cite.querySelector('span') ?? document.createElement('span')

    path.textContent = BREADCRUMB_PATH

    cite.replaceChildren(BREADCRUMB_URL, path)
  }

  describePlaces(localPack:HTMLElement):string {
    return [...localPack.querySelectorAll<HTMLElement>('.rex-local-search-widget-row')]
      .map((row) => this.parsePlace(row))
      .filter((place):place is LocalPlace => place !== null)
      .map((place, index) => this.formatPlace(place, index + 1))
      .join(' · ')
  }

  parsePlace(row:HTMLElement):LocalPlace|null {
    const lines = row.innerText.split('\n').map((line) => line.trim()).filter((line) => line !== '')

    if (lines.includes('Sponsored')) {
      return null
    }

    const name = row.querySelector('[role="heading"]')?.textContent?.trim() ?? lines[0]

    if (name === undefined || name === '') {
      return null
    }

    const place:LocalPlace = { name }
    const ratingIndex = lines.findIndex((line) => RATING_PATTERN.test(line))
    const rating = ratingIndex === -1 ? null : lines[ratingIndex].match(RATING_PATTERN)

    if (rating !== null) {
      place.rating = rating[1]
      place.reviews = rating[2]

      const details = (lines[ratingIndex + 1] ?? '').startsWith('"') ? [] : (lines[ratingIndex + 1] ?? '').split('·').map((detail) => detail.trim()).filter((detail) => detail !== '' && YEARS_IN_BUSINESS_PATTERN.test(detail) === false)

      place.distance = details.find((detail) => DISTANCE_PATTERN.test(detail))

      const address = details.filter((detail) => DISTANCE_PATTERN.test(detail) === false).join(', ')

      if (address !== '') {
        place.address = address
      }
    }

    return place
  }

  formatPlace(place:LocalPlace, position:number):string {
    const parts = [`${position}. ${place.name}.`]

    if (place.rating !== undefined) {
      parts.push(`${place.rating} (${place.reviews} reviews).`)
    }

    if (place.distance !== undefined) {
      parts.push(`${place.distance}.`)
    }

    if (place.address !== undefined) {
      parts.push(place.address)
    }

    return parts.join(' ')
  }
}
