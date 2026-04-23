# Backend additions required for main.go

Add these handlers and register them in main().

## 1. Add bcrypt import
```go
"golang.org/x/crypto/bcrypt"
```

## 2. UserSession struct (add if missing)
```go
type UserSession struct {
    FabricID string `json:"fabricID"`
    Email    string `json:"email"`
    Name     string `json:"name"`
    Role     string `json:"role"`
}
```

## 3. /register — updated to send OTP after Fabric registration
```go
func registerHandler(w http.ResponseWriter, r *http.Request) {
    var data struct {
        Email string `json:"email"`
        Name  string `json:"name"`
        Org   string `json:"org"`
    }
    json.NewDecoder(r.Body).Decode(&data)

    if data.Email == "" {
        http.Error(w, "email is required", 400)
        return
    }
    if data.Org == "" { data.Org = "org1" }

    // Check duplicate
    var existing string
    err := db.QueryRow(`SELECT fabric_id FROM users WHERE email=$1`, data.Email).Scan(&existing)
    if err == nil {
        http.Error(w, "email already registered", 400)
        return
    }

    fabricID := generateFabricID()

    if err := registerUser(fabricID, "USER", data.Org); err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    gw, err := newGateway(fabricID)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    defer gw.Close()

    _, err = submitTx(gw, "RegisterIdentity", fabricID)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    _, dbErr := db.Exec(
        `INSERT INTO users (email, name, fabric_id, role, created_at) VALUES ($1,$2,$3,'USER',NOW())`,
        data.Email, data.Name, fabricID,
    )
    if dbErr != nil {
        http.Error(w, "failed to save user", 500)
        return
    }

    // Send OTP for email verification
    otp := generateOTP()
    otpStore[data.Email] = otp
    otpExpiry[data.Email] = time.Now().Add(5 * time.Minute)
    go sendEmail(data.Email, otp)

    log.Printf("Registered: email=%s fabricID=%s", data.Email, fabricID)
    json.NewEncoder(w).Encode(map[string]string{"message": "OTP sent to " + data.Email})
}
```

## 4. /verify-otp — updated to return full session
```go
func verifyOTPHandler(w http.ResponseWriter, r *http.Request) {
    var data struct {
        Email string `json:"email"`
        OTP   string `json:"otp"`
    }
    json.NewDecoder(r.Body).Decode(&data)

    storedOTP, exists := otpStore[data.Email]
    expiry, expiryExists := otpExpiry[data.Email]

    if !exists || !expiryExists {
        http.Error(w, "OTP not found", 400)
        return
    }
    if time.Now().After(expiry) {
        delete(otpStore, data.Email)
        delete(otpExpiry, data.Email)
        http.Error(w, "OTP expired", 400)
        return
    }
    if storedOTP != data.OTP {
        http.Error(w, "Invalid OTP", 401)
        return
    }

    var fabricID, name, role string
    err := db.QueryRow(
        `SELECT fabric_id, COALESCE(name,''), role FROM users WHERE email=$1`, data.Email,
    ).Scan(&fabricID, &name, &role)
    if err != nil {
        http.Error(w, "User not found", 404)
        return
    }

    delete(otpStore, data.Email)
    delete(otpExpiry, data.Email)

    json.NewEncoder(w).Encode(map[string]string{
        "message":  "Login successful",
        "fabricID": fabricID,
        "name":     name,
        "role":     role,
    })
}
```

## 5. /admin-login — password-based for admins
```go
func adminLoginHandler(w http.ResponseWriter, r *http.Request) {
    var data struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }
    json.NewDecoder(r.Body).Decode(&data)

    var fabricID, name, role, passwordHash string
    err := db.QueryRow(
        `SELECT fabric_id, COALESCE(name,''), role, password_hash FROM users WHERE email=$1`,
        data.Email,
    ).Scan(&fabricID, &name, &role, &passwordHash)
    if err != nil {
        http.Error(w, "invalid credentials", 401)
        return
    }

    if role != "ADMIN" && role != "SUPERADMIN" {
        http.Error(w, "access denied", 403)
        return
    }

    if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(data.Password)); err != nil {
        http.Error(w, "invalid credentials", 401)
        return
    }

    json.NewEncoder(w).Encode(UserSession{
        FabricID: fabricID, Email: data.Email, Name: name, Role: role,
    })
}
```

## 6. /admin-register — invite code gated
```go
// Set this in your .env: ADMIN_INVITE_CODE=smc-admin-2026
func adminRegisterHandler(w http.ResponseWriter, r *http.Request) {
    var data struct {
        Email      string `json:"email"`
        Name       string `json:"name"`
        Password   string `json:"password"`
        InviteCode string `json:"inviteCode"`
    }
    json.NewDecoder(r.Body).Decode(&data)

    expectedCode := os.Getenv("ADMIN_INVITE_CODE")
    if expectedCode == "" { expectedCode = "smc-admin-2026" }

    if data.InviteCode != expectedCode {
        http.Error(w, "invalid invite code", 403)
        return
    }

    var existing string
    err := db.QueryRow(`SELECT fabric_id FROM users WHERE email=$1`, data.Email).Scan(&existing)
    if err == nil {
        http.Error(w, "email already registered", 400)
        return
    }

    hash, _ := bcrypt.GenerateFromPassword([]byte(data.Password), bcrypt.DefaultCost)
    fabricID := generateFabricID()

    if err := registerUser(fabricID, "ADMIN", "org1"); err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    gw, err := newGateway(fabricID)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    defer gw.Close()

    submitTx(gw, "RegisterIdentity", fabricID)

    db.Exec(
        `INSERT INTO users (email, name, fabric_id, role, password_hash, created_at) VALUES ($1,$2,$3,'ADMIN',$4,NOW())`,
        data.Email, data.Name, fabricID, string(hash),
    )

    // Notify superadmin
    go func() {
        superEmail := os.Getenv("SUPERADMIN_EMAIL")
        if superEmail != "" {
            sendSimpleEmail(superEmail, "New Admin Registered",
                fmt.Sprintf("<p>New admin registered: <b>%s</b> (%s)</p>", data.Name, data.Email))
        }
    }()

    json.NewEncoder(w).Encode(map[string]string{"message": "Admin registered successfully"})
}
```

## 7. /get-user — already exists, keep as is

## 8. /my-documents
```go
func myDocumentsHandler(w http.ResponseWriter, r *http.Request) {
    fabricID := r.URL.Query().Get("fabricID")
    if fabricID == "" {
        http.Error(w, "fabricID required", 400)
        return
    }

    rows, err := db.Query(
        `SELECT doc_id, filename, hash, status, COALESCE(tdr_id,''), COALESCE(pdf_path,''), created_at
         FROM documents
         WHERE doc_id IN (SELECT doc_id FROM tdr_history WHERE actor=$1 AND action='UPLOADED')
         ORDER BY created_at DESC`, fabricID,
    )
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    defer rows.Close()

    type Doc struct {
        DocID     string `json:"docID"`
        Filename  string `json:"filename"`
        Hash      string `json:"hash"`
        Status    string `json:"status"`
        TdrID     string `json:"tdrID"`
        PdfPath   string `json:"pdfPath"`
        CreatedAt string `json:"createdAt"`
    }
    var docs []Doc
    for rows.Next() {
        var d Doc
        var ts time.Time
        rows.Scan(&d.DocID, &d.Filename, &d.Hash, &d.Status, &d.TdrID, &d.PdfPath, &ts)
        d.CreatedAt = ts.Format("2 Jan 2006, 15:04")
        docs = append(docs, d)
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{"documents": docs})
}
```

## 9. /my-requests
```go
func myRequestsHandler(w http.ResponseWriter, r *http.Request) {
    fabricID := r.URL.Query().Get("fabricID")
    if fabricID == "" {
        http.Error(w, "fabricID required", 400)
        return
    }

    // Transfer requests by this user
    type TReq struct {
        RequestID  string `json:"requestID"`
        DocID      string `json:"docID"`
        TdrID      string `json:"tdrID"`
        FromOwner  string `json:"fromOwner"`
        ToOwner    string `json:"toOwner"`
        Status     string `json:"status"`
        TxID       string `json:"txID"`
        CreatedAt  string `json:"createdAt"`
        ResolvedAt string `json:"resolvedAt"`
        Reason     string `json:"reason"`
    }
    tRows, _ := db.Query(
        `SELECT request_id, doc_id, tdr_id, from_owner, to_owner, status,
                fabric_tx_id, created_at,
                COALESCE(to_char(resolved_at, 'DD Mon YYYY, HH24:MI'), ''),
                COALESCE(reason,'')
         FROM transfer_requests WHERE from_owner=$1 ORDER BY created_at DESC`, fabricID,
    )
    defer tRows.Close()
    var tReqs []TReq
    for tRows.Next() {
        var req TReq
        var ts time.Time
        tRows.Scan(&req.RequestID, &req.DocID, &req.TdrID, &req.FromOwner, &req.ToOwner,
            &req.Status, &req.TxID, &ts, &req.ResolvedAt, &req.Reason)
        req.CreatedAt = ts.Format("2 Jan 2006, 15:04")
        tReqs = append(tReqs, req)
    }

    // Issue requests by this user
    type IReq struct {
        RequestID  string `json:"requestID"`
        DocID      string `json:"docID"`
        TdrID      string `json:"tdrID"`
        Owner      string `json:"owner"`
        Area       int    `json:"area"`
        Status     string `json:"status"`
        TxID       string `json:"txID"`
        CreatedAt  string `json:"createdAt"`
        ResolvedAt string `json:"resolvedAt"`
        Reason     string `json:"reason"`
    }
    iRows, _ := db.Query(
        `SELECT request_id, doc_id, tdr_id, owner, area, status,
                fabric_tx_id, created_at,
                COALESCE(to_char(resolved_at, 'DD Mon YYYY, HH24:MI'), ''),
                COALESCE(reason,'')
         FROM issue_requests WHERE owner=$1 ORDER BY created_at DESC`, fabricID,
    )
    defer iRows.Close()
    var iReqs []IReq
    for iRows.Next() {
        var req IReq
        var ts time.Time
        iRows.Scan(&req.RequestID, &req.DocID, &req.TdrID, &req.Owner, &req.Area,
            &req.Status, &req.TxID, &ts, &req.ResolvedAt, &req.Reason)
        req.CreatedAt = ts.Format("2 Jan 2006, 15:04")
        iReqs = append(iReqs, req)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "transferRequests": tReqs,
        "issueRequests":    iReqs,
    })
}
```

## 10. /download-pdf — serves the stored PDF file
```go
func downloadPDFHandler(w http.ResponseWriter, r *http.Request) {
    docID := r.URL.Query().Get("docID")
    if docID == "" {
        http.Error(w, "docID required", 400)
        return
    }

    var pdfPath, tdrID string
    err := db.QueryRow(
        `SELECT COALESCE(pdf_path,''), COALESCE(tdr_id,'') FROM documents WHERE doc_id=$1`, docID,
    ).Scan(&pdfPath, &tdrID)
    if err != nil {
        http.Error(w, "document not found", 404)
        return
    }
    if pdfPath == "" {
        http.Error(w, "PDF not generated yet — transfer must be approved first", 404)
        return
    }

    data, err := os.ReadFile(pdfPath)
    if err != nil {
        log.Printf("PDF missing on disk: %s", pdfPath)
        http.Error(w, "PDF file not found on server", 404)
        return
    }

    w.Header().Set("Content-Type", "application/pdf")
    w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="TDR_%s.pdf"`, tdrID))
    w.Header().Set("Content-Length", fmt.Sprintf("%d", len(data)))
    w.Write(data)
}
```

## 11. Email notification in approveIssueTDRHandler
Add this after updating DB status to APPROVED:
```go
// Notify user by email
var ownerEmail string
db.QueryRow("SELECT email FROM users WHERE fabric_id=$1", owner).Scan(&ownerEmail)
if ownerEmail != "" {
    go sendSimpleEmail(ownerEmail,
        "✅ Your TDR Issuance Request Has Been Approved",
        fmt.Sprintf(`
        <h2 style="color:#10b981">TDR Issuance Approved 🎉</h2>
        <p>Your request to issue TDR <b>%s</b> for document <b>%s</b> has been approved.</p>
        <p>The TDR has been minted on the Hyperledger Fabric blockchain.</p>
        <p><a href="https://tdrfront.vercel.app/dashboard">View your dashboard →</a></p>
        `, tdrID, docID))
}
```

## 12. Email notification in approveTransferHandler
Add after PDF is generated:
```go
// Notify new owner
var newOwnerEmail string
db.QueryRow("SELECT email FROM users WHERE fabric_id=$1", toOwner).Scan(&newOwnerEmail)
if newOwnerEmail != "" && len(pdfBytes) > 0 {
    go sendEmailWithAttachment(newOwnerEmail,
        "✅ TDR Transfer Approved — Certificate Attached",
        fmt.Sprintf(`
        <h2 style="color:#10b981">TDR Transferred to You ✅</h2>
        <p>The Transfer of Development Rights <b>%s</b> has been transferred to you.</p>
        <p>Your new certificate is attached to this email.</p>
        <p><a href="https://tdrfront.vercel.app/dashboard">Download from dashboard →</a></p>
        `, tdrID),
        pdfPath,
    )
}
// Notify old owner
var oldOwnerEmail string
db.QueryRow("SELECT email FROM users WHERE fabric_id=$1", fromOwner).Scan(&oldOwnerEmail)
if oldOwnerEmail != "" {
    go sendSimpleEmail(oldOwnerEmail,
        "TDR Transfer Completed",
        fmt.Sprintf(`<h2>TDR Transfer Completed</h2>
        <p>Your TDR <b>%s</b> has been successfully transferred.</p>`, tdrID))
}
```

## 13. Seed SuperAdmin — run once at startup
```go
func seedSuperAdmin() {
    email := os.Getenv("SUPERADMIN_EMAIL")
    password := os.Getenv("SUPERADMIN_PASSWORD")
    if email == "" || password == "" {
        log.Println("SUPERADMIN_EMAIL/PASSWORD not set, skipping seed")
        return
    }

    var exists bool
    db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)`, email).Scan(&exists)
    if exists {
        log.Printf("SuperAdmin %s already exists", email)
        return
    }

    fabricID := generateFabricID()
    if err := registerUser(fabricID, "SUPERADMIN", "org1"); err != nil {
        log.Printf("SuperAdmin Fabric registration failed: %v", err)
        return
    }

    gw, err := newGateway(fabricID)
    if err != nil {
        log.Printf("SuperAdmin gateway failed: %v", err)
        return
    }
    defer gw.Close()
    submitTx(gw, "RegisterIdentity", fabricID)

    hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    db.Exec(
        `INSERT INTO users (email, name, fabric_id, role, password_hash, created_at)
         VALUES ($1, 'SuperAdmin', $2, 'SUPERADMIN', $3, NOW())`,
        email, fabricID, string(hash),
    )
    log.Printf("✅ SuperAdmin seeded: %s fabricID=%s", email, fabricID)
}
```

Call it in main():
```go
func main() {
    godotenv.Load()
    initDB()
    go seedSuperAdmin() // runs async so it doesn't block startup

    mux := http.NewServeMux()
    // ... existing routes ...
    mux.HandleFunc("/admin-login",    adminLoginHandler)
    mux.HandleFunc("/admin-register", adminRegisterHandler)
    mux.HandleFunc("/my-documents",   myDocumentsHandler)
    mux.HandleFunc("/my-requests",    myRequestsHandler)
    mux.HandleFunc("/download-pdf",   downloadPDFHandler)
    // ...
}
```

## 14. Add to .env
```
SUPERADMIN_EMAIL=superadmin@smc.gov.in
SUPERADMIN_PASSWORD=YourSecurePassword123
ADMIN_INVITE_CODE=smc-admin-2026
SUPERADMIN_NOTIFICATION_EMAIL=superadmin@smc.gov.in
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
```

## 15. DB migration (if columns missing)
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE issue_requests ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE issue_requests ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS resolved_by TEXT;
```
