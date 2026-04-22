/**
 * Google 내지도(My Maps)에서 내보낸 KML 파일을 파싱합니다.
 * <Placemark> 중 <Point> 좌표가 있는 항목만 반환합니다.
 */
export function parseKML(text) {
  const doc = new DOMParser().parseFromString(text, 'text/xml')

  if (doc.querySelector('parsererror')) {
    throw new Error('유효하지 않은 KML 파일입니다.')
  }

  // 폴더(레이어) 이름 매핑: Placemark → 상위 Folder name
  function getFolderName(pm) {
    let node = pm.parentElement
    while (node) {
      if (node.tagName === 'Folder') {
        return node.querySelector(':scope > name')?.textContent?.trim() || ''
      }
      node = node.parentElement
    }
    return ''
  }

  function cleanText(raw = '') {
    return raw
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // CDATA 언래핑
      .replace(/<[^>]*>/g, '')                        // HTML 태그 제거
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()
  }

  const placemarks = Array.from(doc.querySelectorAll('Placemark'))
  const results = []

  placemarks.forEach((pm, i) => {
    const coordEl = pm.querySelector('Point coordinates')
    if (!coordEl) return // 선, 도형은 제외, 포인트만

    const parts = coordEl.textContent.trim().split(',').map(Number)
    const lng = parts[0]
    const lat = parts[1]
    if (isNaN(lat) || isNaN(lng)) return

    const name = cleanText(pm.querySelector('name')?.textContent) || '장소'
    const desc = cleanText(pm.querySelector('description')?.textContent)

    results.push({
      id: `kml_${i}_${Date.now()}`,
      name,
      description: desc,
      lat,
      lng,
      layer: getFolderName(pm),
    })
  })

  return results
}
