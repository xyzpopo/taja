const express = require('express')
const cors = require('cors')
const admin = require('firebase-admin')

// Render 등의 환경변수에 Firebase 콘솔에서 받은 서비스 계정 JSON을 통째로 붙여넣어 사용합니다.
// (프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const ADMIN_EMAIL = 'xyz.lee.xyz1112@gmail.com'
const DOMAIN = '@yongin.com'

function pad2(n) {
  return String(n).padStart(2, '0')
}
function studentEmail(grade, classNum, number) {
  return `${grade}${pad2(classNum)}${pad2(number)}${DOMAIN}`
}

const db = () => admin.firestore()

const app = express()
app.use(cors())
app.use(express.json())

// 관리자 로그인 세션(Firebase ID 토큰)을 검증하는 미들웨어.
// 클라이언트는 매 요청마다 Authorization: Bearer <idToken> 헤더를 보내야 합니다.
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' })

    const decoded = await admin.auth().verifyIdToken(token)
    if (decoded.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: '관리자만 사용할 수 있는 기능입니다.' })
    }
    next()
  } catch (err) {
    res.status(401).json({ error: '인증에 실패했습니다.' })
  }
}

app.get('/', (req, res) => res.send('typing practice admin server OK'))

// ------------------------------------------------------------------
app.post('/approveTeacher', requireAdmin, async (req, res) => {
  try {
    const { uid, message } = req.body
    if (!uid) return res.status(400).json({ error: 'uid가 필요합니다.' })

    const userRef = db().collection('users').doc(uid)
    const userSnap = await userRef.get()
    if (!userSnap.exists) return res.status(404).json({ error: '해당 사용자를 찾을 수 없습니다.' })

    await userRef.update({
      role: 'teacher',
      status: 'active',
      ...(message ? { adminMessage: message } : {}),
    })
    await db().collection('teacherRequests').doc(uid).delete()

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ------------------------------------------------------------------
app.post('/rejectTeacher', requireAdmin, async (req, res) => {
  try {
    const { uid } = req.body
    if (!uid) return res.status(400).json({ error: 'uid가 필요합니다.' })

    await db().collection('users').doc(uid).delete()
    await db().collection('teacherRequests').doc(uid).delete()
    try {
      await admin.auth().deleteUser(uid)
    } catch (err) {
      console.warn('deleteUser failed', err.message)
    }

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ------------------------------------------------------------------
app.post('/approveGradeChange', requireAdmin, async (req, res) => {
  try {
    const { requestId, message } = req.body
    if (!requestId) return res.status(400).json({ error: 'requestId가 필요합니다.' })

    const reqRef = db().collection('gradeChangeRequests').doc(requestId)
    const reqSnap = await reqRef.get()
    if (!reqSnap.exists) return res.status(404).json({ error: '요청을 찾을 수 없습니다.' })
    const reqData = reqSnap.data()

    const newEmail = studentEmail(reqData.targetGrade, reqData.targetClassNum, reqData.targetNumber)

    try {
      await admin.auth().updateUser(reqData.uid, { email: newEmail })
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        return res.status(409).json({
          error: '해당 학년/반/번호는 이미 다른 계정이 사용 중입니다. 먼저 그 계정을 확인해주세요.',
        })
      }
      throw err
    }

    await db()
      .collection('users')
      .doc(reqData.uid)
      .update({
        grade: reqData.targetGrade,
        classNum: reqData.targetClassNum,
        number: reqData.targetNumber,
        ...(message ? { adminMessage: message } : {}),
      })
    await reqRef.delete()

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ------------------------------------------------------------------
app.post('/rejectGradeChange', requireAdmin, async (req, res) => {
  try {
    const { requestId, message } = req.body
    if (!requestId) return res.status(400).json({ error: 'requestId가 필요합니다.' })

    const reqRef = db().collection('gradeChangeRequests').doc(requestId)
    const reqSnap = await reqRef.get()
    if (reqSnap.exists && message) {
      await db().collection('users').doc(reqSnap.data().uid).update({ adminMessage: message })
    }
    await reqRef.delete()

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ------------------------------------------------------------------
app.post('/promoteAllPending', requireAdmin, async (req, res) => {
  try {
    const dryRun = req.body?.dryRun !== false

    const [reqSnap, studentSnap] = await Promise.all([
      db().collection('gradeChangeRequests').get(),
      db().collection('users').where('role', '==', 'student').where('status', '==', 'active').get(),
    ])

    const requests = reqSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const requestedUids = new Set(requests.map((r) => r.uid))
    const toDelete = studentSnap.docs.filter((d) => !requestedUids.has(d.id))

    if (dryRun) {
      return res.json({ promoted: requests.length, toDelete: toDelete.length })
    }

    let promoted = 0
    for (const reqData of requests) {
      try {
        const newEmail = studentEmail(reqData.targetGrade, reqData.targetClassNum, reqData.targetNumber)
        await admin.auth().updateUser(reqData.uid, { email: newEmail })
        await db()
          .collection('users')
          .doc(reqData.uid)
          .update({ grade: reqData.targetGrade, classNum: reqData.targetClassNum, number: reqData.targetNumber })
        await db().collection('gradeChangeRequests').doc(reqData.id).delete()
        promoted++
      } catch (err) {
        console.warn('promote failed for', reqData.uid, err.message)
      }
    }

    let removed = 0
    for (const docSnap of toDelete) {
      try {
        await admin.auth().deleteUser(docSnap.id)
      } catch (err) {
        console.warn('deleteUser failed', docSnap.id, err.message)
      }
      await docSnap.ref.delete()
      removed++
    }

    res.json({ promoted, removed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ------------------------------------------------------------------
app.post('/resetPassword', requireAdmin, async (req, res) => {
  try {
    const { requestId, newPassword } = req.body
    if (!requestId || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'requestId와 6자 이상의 새 비밀번호가 필요합니다.' })
    }

    const reqRef = db().collection('passwordResetRequests').doc(requestId)
    const reqSnap = await reqRef.get()
    if (!reqSnap.exists) return res.status(404).json({ error: '요청을 찾을 수 없습니다.' })
    const reqData = reqSnap.data()

    const email = studentEmail(reqData.grade, reqData.classNum, reqData.number)
    let userRecord
    try {
      userRecord = await admin.auth().getUserByEmail(email)
    } catch (err) {
      return res.status(404).json({ error: '해당 학년/반/번호의 계정을 찾을 수 없습니다.' })
    }

    await admin.auth().updateUser(userRecord.uid, { password: newPassword })
    await db()
      .collection('users')
      .doc(userRecord.uid)
      .update({ adminMessage: `임시 비밀번호가 발급되었습니다: ${newPassword} (로그인 후 꼭 확인하세요)` })
    await reqRef.update({ status: 'resolved' })

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ------------------------------------------------------------------
// 신고 처리: 영구정지 (교사는 임시정지만 가능, 영구정지는 관리자만)
// ------------------------------------------------------------------
app.post('/permanentBan', requireAdmin, async (req, res) => {
  try {
    const { reportId, uid } = req.body
    if (!uid) return res.status(400).json({ error: 'uid가 필요합니다.' })

    await db().collection('users').doc(uid).update({ banned: true, status: 'suspended' })
    try {
      await admin.auth().updateUser(uid, { disabled: true })
    } catch (err) {
      console.warn('disable user failed', uid, err.message)
    }

    if (reportId) {
      await db().collection('reports').doc(reportId).update({ status: 'banned' })
    }

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`admin server listening on ${PORT}`))
