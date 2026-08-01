import { auth } from './firebase'

// Cloud Functions(Blaze 필요) 대신, 무료로 호스팅한 외부 관리자 서버(server/index.js)를 호출합니다.
// 배포 후 이 URL을 .env의 VITE_ADMIN_SERVER_URL에 채워주세요. (예: https://your-app.onrender.com)
const BASE_URL = import.meta.env.VITE_ADMIN_SERVER_URL

export async function callAdminServer(path, body = {}) {
  if (!BASE_URL) {
    throw new Error('VITE_ADMIN_SERVER_URL이 설정되지 않았습니다. .env를 확인해주세요.')
  }
  if (!auth.currentUser) {
    throw new Error('로그인이 필요합니다.')
  }

  const idToken = await auth.currentUser.getIdToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `요청에 실패했습니다. (${res.status})`)
  }
  return data
}
