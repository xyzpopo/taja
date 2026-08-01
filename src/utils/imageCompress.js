// Firebase Storage(유료 플랜 필요)를 쓰지 않기 위해, 이미지를 충분히 압축해서
// Firestore 문서 안에 base64 문자열로 직접 저장합니다. Firestore 문서 하나의 한도는 1MB라서,
// 그보다 훨씬 작게(목표 700KB 이하) 줄어들 때까지 크기/품질을 단계적으로 낮춥니다.
const MAX_OUTPUT_BYTES = 700 * 1024

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function canvasToDataUrl(img, maxWidth, quality) {
  const scale = Math.min(1, maxWidth / img.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

function dataUrlByteSize(dataUrl) {
  // base64 문자열 1글자 ≈ 0.75바이트
  return Math.round((dataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75)
}

// 실패하면(너무 크거나 이미지가 아니면) 에러를 던집니다.
export async function compressImageToDataUrl(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 올릴 수 있어요.')
  }

  const img = await loadImage(file)
  const attempts = [
    { maxWidth: 1000, quality: 0.7 },
    { maxWidth: 800, quality: 0.6 },
    { maxWidth: 600, quality: 0.5 },
    { maxWidth: 480, quality: 0.4 },
    { maxWidth: 360, quality: 0.35 },
  ]

  let result = null
  for (const attempt of attempts) {
    const dataUrl = canvasToDataUrl(img, attempt.maxWidth, attempt.quality)
    result = dataUrl
    if (dataUrlByteSize(dataUrl) <= MAX_OUTPUT_BYTES) {
      URL.revokeObjectURL(img.src)
      return dataUrl
    }
  }

  URL.revokeObjectURL(img.src)
  if (result && dataUrlByteSize(result) <= MAX_OUTPUT_BYTES * 1.3) {
    // 마지막 시도가 살짝 넘긴 정도면 그냥 허용 (문서 한도 1MB에 다른 필드까지 감안해도 여유 있음)
    return result
  }
  throw new Error('이미지 용량이 너무 커요. 더 작은 이미지로 다시 시도해주세요.')
}
