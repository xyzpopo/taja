# 타자연습

한컴타자연습을 본떠 만든 학교용 한/영타 연습 웹앱입니다. React + Vite + Firebase(Auth/Firestore) + 무료 관리자 서버(Node/Express, Render.com 배포)로 구성되어 있습니다.

## 기능 요약

- **회원가입/로그인**: 학년(1~3) · 반(2자리) · 번호(2자리) + 비밀번호. 내부적으로 `학년+반+번호@yongin.com` 형식의 이메일로 Firebase Auth에 저장됩니다.
  - 예) 1학년 1반 14번 → `10114@yongin.com`
  - 예) 2학년 3반 6번 → `20306@yongin.com`
- **교사 가입**: 번호 칸에 `선생`을 입력하면 교사 신청으로 처리되고, 관리자 승인 전까지는 로그인이 제한됩니다. 승인/거부는 관리자 패널에서 처리합니다(회원가입 시에만 신청 가능).
- **한타/영타 연습**: 게시물을 올리지 않아도 자유롭게 연습 가능. 결과는 `[한타,정확도%,분당타수타]` 형식으로 표시됩니다.
- **SNS**: 연습 직후 결과와 함께 제목/내용/이미지 1장을 올려 공유할 수 있습니다. 제목/내용에 간단한 비속어 필터가 적용되고, 최근 게시물 안에서 검색할 수 있습니다.
- **랭킹**: 한타/영타 각각 분당 타수 기준 상위 기록(사용자별 최고기록 `bestScores` 기준).
- **교사 페이지**: 담임 학급 학생 게시물 모아보기, 게시물 삭제, 학생 게시 정지/해제(영구 정지 불가).
- **비밀번호 찾기**: 로그인 없이 학년/반/번호/이름으로 요청 제출 → 관리자가 패널에서 임시 비밀번호 발급.
- **학년/반/번호 변경 요청**: 학생이 언제든 새 학년/반/번호를 요청 → 관리자가 승인하면 같은 계정(uid)에 학년/반/번호와 로그인 이메일만 바뀌고, 기존에 쓴 글/기록은 전부 그대로 유지됩니다. 이미 같은 자리로 신청된 요청이 있으면 자동으로 거부됩니다.
- **관리자 패널** (`/admin`, 로그인 화면 맨 아래 아주 흐리게 표시되는 "관리자 전환" 링크로 접근): 교사승인/학년변경/비밀번호찾기 요청을 하나의 수신함으로 확인하고 승인·거부. **새학년** 버튼으로 학년변경 요청을 일괄 승인하고 요청하지 않은 학생 계정은 삭제. **공지** 버튼으로 전체 공지 등록.

> 관리자 로그인은 실제 구글 비밀번호가 아니라, Firebase Authentication에 별도로 등록한 이메일/비밀번호입니다(아래 1-7 참고). "숨겨진 버튼"은 어디까지나 학생들이 무심코 못 보게 하는 정도이고, 실제 보안은 이 비밀번호 검증이 담당합니다 — 페이지 소스를 보면 `/admin-login` 경로 자체는 누구나 알 수 있습니다.

---

## 1. Firebase 프로젝트 준비

### 1-1. 프로젝트 생성
1. https://console.firebase.google.com 접속 → **프로젝트 추가**
2. 프로젝트 이름 입력 (예: `yongin-typing`) 후 생성

### 1-2. 요금제
**완전 무료(Spark)로 사용합니다.** Firestore/Authentication은 무료 한도가 넉넉해서 학교 규모 사용량이면 결제수단 등록 없이 그대로 씁니다. 게시물 이미지는 Firebase Storage(유료 플랜 필요) 대신 압축해서 Firestore 문서에 직접 저장합니다. 관리자 전용 특권 작업(교사승인/학년변경/새학년/비번재설정)은 Firebase Cloud Functions 대신 `server/` 폴더의 별도 Node 서버가 처리하며, 이 서버는 Render.com 같은 무료 호스팅에 올립니다(4번 섹션 참고).

### 1-3. 웹 앱 등록
1. 프로젝트 개요 → `</>` (웹 아이콘) 클릭 → 앱 닉네임 입력 후 등록
2. 표시되는 `firebaseConfig` 값을 복사해 `.env` 파일에 입력 (`.env.example` 참고)

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 1-4. Authentication
1. 콘솔 → Build → Authentication → 시작하기
2. 로그인 방법 → **이메일/비밀번호** 활성화

### 1-5. Firestore
1. 콘솔 → Build → Firestore Database → 데이터베이스 만들기 (프로덕션 모드, 리전은 `asia-northeast3(서울)` 권장)
2. 규칙은 아래 3번 항목에서 CLI로 배포합니다.

### 1-6. (필요 없음) Storage
이미지는 Firestore 문서에 직접 저장하므로 Firebase Storage를 켤 필요가 없습니다.

### 1-7. 관리자 계정 만들기
관리자(선생님/개발자, `xyz.lee.xyz1112@gmail.com`)는 학생/교사 가입 절차를 거치지 않고, **Authentication 콘솔에서 직접 사용자 추가**해야 합니다.
1. Authentication → Users → 사용자 추가
2. 이메일: `xyz.lee.xyz1112@gmail.com`, 원하는 비밀번호 입력
3. 앱의 `/admin-login` 페이지에서 이 이메일/비밀번호로 로그인하면 `/admin`에 접근할 수 있습니다.

> 관리자 권한은 코드 내에서 **이 이메일 주소인지 여부**로만 판별합니다(`src/firebase.js`의 `ADMIN_EMAIL`, `firestore.rules`, `server/index.js` 3곳에 동일하게 박혀있습니다). 이메일을 바꾸고 싶으면 세 파일 모두 수정 후 재배포해야 합니다.

관리자 화면은 로그인 페이지 맨 아래의 아주 흐린 "관리자 전환" 링크(`/admin-login`)로 들어가서, 위에서 만든 이메일/비밀번호로 로그인하면 됩니다. 별도 이메일 발송 없이 앱 안의 관리자 패널(`/admin`)에서 교사승인/학년변경/비밀번호찾기 요청을 모두 확인할 수 있습니다.

### 1-8. 서비스 계정 키 발급 (무료 관리자 서버용)
1. 콘솔 → 프로젝트 설정(톱니바퀴) → 서비스 계정 탭
2. **새 비공개 키 생성** → JSON 파일 다운로드
3. 이 JSON 파일의 전체 내용을 4번 섹션에서 Render 환경변수 `FIREBASE_SERVICE_ACCOUNT_JSON`에 붙여넣습니다. (절대 GitHub에 올리지 마세요 - `server/.gitignore`에 이미 제외 처리되어 있습니다)

---

## 2. 로컬 개발

```bash
npm install
cp .env.example .env   # 위 1-3에서 받은 값 채우기
npm run dev
```

`http://localhost:5173` 에서 확인합니다.

---

## 3. Firebase 배포 (Hosting / Firestore 규칙)

```bash
npm install -g firebase-tools
firebase login

# 이 저장소 루트에 firebase.json이 이미 준비되어 있으므로 init 없이 바로 사용 가능합니다.
firebase use --add        # 위에서 만든 프로젝트 선택 후 별칭(alias) 지정, 예: default

npm run build
firebase deploy           # 규칙 + 인덱스 + 호스팅 배포 (Blaze 불필요)
```

배포가 끝나면 콘솔에 나오는 Hosting URL(`https://<프로젝트id>.web.app`)로 접속할 수 있습니다.

### 인덱스 관련 참고
`firestore.indexes.json`에 필요한 복합 인덱스를 미리 정의해두었습니다(`firebase deploy`에 포함). 만약 앱 사용 중 콘솔에 "인덱스가 필요합니다"라는 에러 링크가 뜨면, 링크를 눌러 인덱스를 생성해도 됩니다.

## 3-2. 관리자 서버 배포 (Render.com, 무료)

1. https://render.com 가입 (GitHub 계정으로 가능)
2. **New +** → **Web Service** → 이 GitHub 저장소 선택
3. 설정값 입력:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: **Free**
4. 환경변수(Environment) 추가:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = 1-8에서 받은 JSON 파일 전체 내용
5. 배포되면 `https://xxxx.onrender.com` 같은 주소가 생깁니다. 이 주소를 프론트엔드 `.env`의 `VITE_ADMIN_SERVER_URL`에 넣고 다시 `npm run build && firebase deploy`를 실행하세요.

> Render 무료 플랜은 트래픽이 없으면 서버가 잠들었다가(cold start) 첫 요청 때 몇 초 늦게 응답할 수 있습니다. 관리자 패널에서만 쓰는 기능이라 학생 사용 경험에는 영향이 없습니다.

---

## 4. GitHub에 올리기

```bash
git init
git add .
git commit -m "초기 커밋: 타자연습"
git branch -M main
git remote add origin https://github.com/<본인계정>/<저장소이름>.git
git push -u origin main
```

**중요:** `.env`와 `server/.env`(있다면)는 `.gitignore`에 이미 포함되어 있어 커밋되지 않습니다. Firebase의 `apiKey` 등은 사실 공개되어도 보안상 큰 문제는 없지만(진짜 보안은 Firestore 규칙이 담당), 그래도 저장소를 public으로 올릴 경우를 대비해 기본적으로 제외해두었습니다. 협업자에게는 `.env.example`을 기준으로 값을 공유하세요.

### (선택) GitHub Actions로 자동 배포
Firebase 콘솔의 Hosting 탭 → "GitHub 연동"을 사용하면, main 브랜치에 push할 때마다 자동으로 `firebase deploy`가 실행되는 워크플로 파일을 자동 생성해줍니다(빌드까지 GitHub 서버에서 대신 해주므로, 로컬에 Node/CLI가 없어도 배포할 수 있습니다). 자세한 실행 방법은 아래 "터미널 없이 하는 법" 섹션을 참고하세요.

---

## 5. 계정/데이터 구조 요약

| 컬렉션 | 설명 |
|---|---|
| `users/{uid}` | name, grade, classNum, number, role(`student`/`teacher`/`pending_teacher`), status(`active`/`suspended`), adminMessage |
| `teacherRequests/{uid}` | 교사 승인 대기 (승인/거부되면 삭제됨) |
| `gradeChangeRequests/{targetSlotKey}` | 학년/반/번호 변경 요청. 문서 ID가 "목표 자리"라서 같은 자리 중복 요청이 자동으로 막힘 |
| `passwordResetRequests/{id}` | 비밀번호 찾기 요청 (로그인 없이 제출 가능) |
| `announcements/{id}` | 관리자 공지 |
| `posts/{postId}` | SNS 게시물 (title, content, imageData(base64), type, accuracy, cpm, authorGrade/classNum, deleted) |
| `scores/{scoreId}` | 매 연습마다 쌓이는 전체 이력 (게시 여부와 무관) |
| `bestScores/{uid_type}` | 사용자별 한타/영타 최고기록 (랭킹 페이지가 실제로 조회하는 곳) |

## 6. 학년이 바뀔 때

이제는 자동 일괄 처리 대신 **요청 → 승인** 방식입니다.
1. 학생이 홈 화면 하단 "학년/반/번호가 바뀌었나요?" 링크로 새 학년/반/번호를 요청합니다(로그인 상태에서 언제든 가능).
2. 관리자가 `/admin`(로그인 페이지 맨 아래 "관리자 전환")에서 요청을 하나씩 승인/거부하거나, **새학년** 버튼으로 대기 중인 요청을 한 번에 승인 처리할 수 있습니다.
3. **새학년**을 실행하면, 요청을 넣지 않은 학생 계정은 삭제됩니다 — 실행 전 미리보기(예상 처리 건수)가 뜨고, 한 번 더 확인해야 실제로 실행됩니다.
4. 같은 uid를 유지한 채 grade/classNum/number와 로그인 이메일만 바뀌므로, 이전에 쓴 게시물과 연습 기록은 전부 그대로 남습니다.
5. 담임(교사) 계정의 새 학급 배정은 자동화 범위 밖이라 관리자가 수동으로 확인/조정해야 합니다.

## 7. 알아두면 좋은 제한 사항

- 분당 타수(타)는 한컴타자연습처럼 한글은 초성/중성/종성 자모 입력 횟수로, 영문은 글자 수로 근사 계산합니다(`src/utils/typingUtils.js`).
- 정지(suspended)된 학생은 SNS 게시물 작성만 막히고, 연습·랭킹 열람은 계속 가능합니다.
- 삭제된 게시물은 실제로 지워지지 않고 `deleted:true`로 표시만 됩니다(소프트 삭제).
- 이미지는 Storage 없이 브라우저에서 압축해 Firestore 문서에 base64로 저장합니다(대략 700KB 이하로 자동 압축, 그래도 너무 크면 업로드가 거부됩니다). 아주 큰 원본 이미지는 화질이 꽤 낮아질 수 있어요.
