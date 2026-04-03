let loadPromise = null

/**
 * 카카오맵 JS SDK를 동적으로 로드합니다.
 * services(키워드 검색) + clusterer(마커 클러스터) 라이브러리 포함
 */
export function loadKakaoMaps(apiKey) {
  if (window.kakao?.maps?.services) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => resolve())
    }
    script.onerror = () => {
      loadPromise = null
      reject(new Error('카카오맵 로드 실패'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}
