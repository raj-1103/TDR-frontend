# SMC e-TDR Portal — Next.js Frontend

Official blockchain portal for Surat Municipal Corporation's Transfer of Development Rights system.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + custom CSS variables
- **Icons**: Lucide React
- **Fonts**: Playfair Display + DM Sans (Google Fonts)
- **Backend**: Go HTTP API at `localhost:8080`
- **Blockchain**: Hyperledger Fabric via Go backend

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Set backend URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Pages & Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Home — hero, services, stats |
| `/login` | Public | Email + password login |
| `/register` | Public | Register Fabric identity |
| `/verify` | Public | Verify any TDR document by hash |
| `/dashboard` | USER+ | User home, identity card |
| `/dashboard/upload` | USER+ | Upload PDF document |
| `/dashboard/issue` | USER+ | Request TDR issuance |
| `/dashboard/transfer` | USER+ | Request TDR transfer |
| `/history` | USER+ | Document blockchain audit trail |
| `/admin` | ADMIN+ | Approve/reject issue & transfer requests |
| `/admin/users` | SUPERADMIN | List all users, promote to admin |

---

## API Integration

All calls go through `src/lib/api.ts`. Set `NEXT_PUBLIC_API_URL` to your Go backend.

### Auth flow
1. `POST /register` → returns `{ fabricID, email, name, role }`
2. `POST /login` → same response
3. Session stored in `localStorage` as `tdr_session`
4. `fabricID` used in all subsequent API calls

### Full TDR workflow
```
Register → Login → Upload Doc (get docID) 
→ Request Issue TDR (docID + tdrID + area) 
→ Admin Approves → TDR minted on chain
→ Request Transfer (docID + new owner fabricID)
→ Admin Approves → PDF generated + returned
→ Verify (docID + hash) → public check
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Go backend URL |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home
│   ├── layout.tsx            # Root layout + AuthProvider
│   ├── globals.css           # Design tokens + global styles
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── verify/page.tsx       # Public verify (supports ?docID=&hash= from QR)
│   ├── history/page.tsx      # Document audit trail
│   ├── dashboard/
│   │   ├── layout.tsx        # Auth guard + sidebar
│   │   ├── page.tsx
│   │   ├── upload/page.tsx
│   │   ├── issue/page.tsx
│   │   └── transfer/page.tsx
│   └── admin/
│       ├── page.tsx          # Approve/reject requests
│       └── users/page.tsx    # User management (SuperAdmin)
├── components/
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   └── NoticeTicker.tsx
├── hooks/
│   └── useAuth.tsx           # Session context
└── lib/
    └── api.ts                # All backend API calls
```
