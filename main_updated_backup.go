package main

import (
	"bytes"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"html/template"
	"io"
	"log"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/smtp"
	"os"
	"path/filepath"
	"strings"
	"time"

	wkhtmltopdf "github.com/SebastiaanKlippert/go-wkhtmltopdf"
	"github.com/hyperledger/fabric-ca/api"
	"github.com/hyperledger/fabric-ca/lib"
	catls "github.com/hyperledger/fabric-ca/lib/tls"
	"github.com/hyperledger/fabric-gateway/pkg/client"
	"github.com/hyperledger/fabric-gateway/pkg/identity"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	qrcode "github.com/skip2/go-qrcode"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/sha3"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

// ── OTP store (in-memory) ─────────────────────────────────
var otpStore  = make(map[string]string)
var otpExpiry = make(map[string]time.Time)

// ── Structs ───────────────────────────────────────────────

type OCRData struct {
	DocID           string  `json:"doc_id"`
	CertificateNo   string  `json:"certificate_no"`
	DateOfIssue     string  `json:"date_of_issue"`
	FileNo          *string `json:"file_no"`
	BeneficiaryName string  `json:"beneficiary_name"`
	Address         *string `json:"address"`
	Purpose         string  `json:"purpose"`
	TPScheme        string  `json:"tp_scheme"`
	SurveyNo        string  `json:"survey_no"`
	SurrenderedArea string  `json:"surrendered_area"`
	TDRIssued       string  `json:"tdr_issued"`
	Keccak256Hash   *string `json:"keccak256_hash"`
	RawJSON         *string `json:"raw_json"`
}

type TDRTemplateData struct {
	OCRData
	TxID      string
	Hash      string
	EthTxHash string
	QRCode    template.URL
	VerifyURL string
}

type UserSession struct {
	FabricID string `json:"fabricID"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Role     string `json:"role"`
}

var db *sql.DB

// ── DB ────────────────────────────────────────────────────

func initDB() {
	connStr := "host=localhost port=5432 user=postgres password=raj@lathigra7 dbname=postgres sslmode=disable"
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}
	fmt.Println("Connected to DB")
}

// ── ID generators ─────────────────────────────────────────

func generateDocID() string {
	year := time.Now().Year()
	chars := "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	rand.Seed(time.Now().UnixNano())
	suffix := make([]byte, 4)
	for i := range suffix {
		suffix[i] = chars[rand.Intn(len(chars))]
	}
	return fmt.Sprintf("TDR-%d-%s", year, string(suffix))
}

func generateFabricID() string {
	chars := "abcdefghjklmnpqrstuvwxyz23456789"
	for {
		rand.Seed(time.Now().UnixNano())
		suffix := make([]byte, 12)
		for i := range suffix {
			suffix[i] = chars[rand.Intn(len(chars))]
		}
		id := fmt.Sprintf("user-%s", string(suffix))
		var count int
		db.QueryRow(`SELECT COUNT(*) FROM users WHERE fabric_id=$1`, id).Scan(&count)
		if count == 0 {
			return id
		}
		log.Printf("FabricID collision for %s, retrying...", id)
	}
}

func generateOTP() string {
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

func generateHash(data []byte) string {
	h := sha3.NewLegacyKeccak256()
	h.Write(data)
	return hex.EncodeToString(h.Sum(nil))
}

func hsmSign(message []byte) ([]byte, error) {
	hash := sha256.Sum256(message)
	return hash[:], nil
}

func min512(n int) int {
	if n < 512 {
		return n
	}
	return 512
}

// ── SMTP helpers ──────────────────────────────────────────

func smtpAuth() (smtp.Auth, string, string) {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	return smtp.PlainAuth("", user, pass, host), host, port
}

func sendEmail(to, otp string) error {
	auth, host, port := smtpAuth()
	user := os.Getenv("SMTP_USER")
	msg := []byte("Subject: SMC e-TDR — OTP Verification\r\n\r\nYour OTP is: " + otp + "\r\n\r\nValid for 5 minutes.")
	return smtp.SendMail(host+":"+port, auth, user, []string{to}, msg)
}

func sendSimpleEmail(to, subject, body string) error {
	auth, host, port := smtpAuth()
	user := os.Getenv("SMTP_USER")
	msg := []byte("MIME-version: 1.0;\r\nContent-Type: text/html; charset=\"UTF-8\";\r\nSubject: " + subject + "\r\n\r\n" + body)
	return smtp.SendMail(host+":"+port, auth, user, []string{to}, msg)
}

func sendEmailWithAttachment(to, subject, body, filePath string) error {
	auth, host, port := smtpAuth()
	from := os.Getenv("SMTP_USER")

	fileData, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read attachment: %w", err)
	}

	boundary := fmt.Sprintf("boundary-%d", time.Now().UnixNano())
	header := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=%s\r\n\r\n", from, to, subject, boundary)
	bodyPart := fmt.Sprintf("--%s\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s\r\n", boundary, body)
	filePart := fmt.Sprintf("--%s\r\nContent-Type: application/pdf\r\nContent-Disposition: attachment; filename=\"tdr_certificate.pdf\"\r\nContent-Transfer-Encoding: base64\r\n\r\n%s\r\n", boundary, base64.StdEncoding.EncodeToString(fileData))
	closing := fmt.Sprintf("--%s--\r\n", boundary)

	return smtp.SendMail(host+":"+port, auth, from, []string{to}, []byte(header+bodyPart+filePart+closing))
}

// ── EVM + QR + OCR ───────────────────────────────────────

func anchorToEVM(docID, hash, txID string) (string, error) {
	payload := map[string]string{"docID": docID, "hash": hash, "txID": txID}
	body, _ := json.Marshal(payload)
	c := &http.Client{Timeout: 60 * time.Second}
	resp, err := c.Post("http://localhost:3001/anchor", "application/json", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("EVM anchor failed: %w", err)
	}
	defer resp.Body.Close()
	var result struct{ EthTxHash string `json:"ethTxHash"` }
	json.NewDecoder(resp.Body).Decode(&result)
	return result.EthTxHash, nil
}

func generateQRCode(verifyURL string) (string, error) {
	png, err := qrcode.Encode(verifyURL, qrcode.Medium, 150)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(png), nil
}

func callOCRAPI(filePath string, docID string) (*OCRData, error) {
	log.Printf("Waking up OCR service...")
	wakeClient := &http.Client{Timeout: 60 * time.Second}
	wakeClient.Get("https://ocr-an38.onrender.com/")

	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	writer.WriteField("doc_id", docID)
	part, _ := writer.CreateFormFile("file", filepath.Base(filePath))
	io.Copy(part, file)
	writer.Close()

	ocrClient := &http.Client{Timeout: 120 * time.Second}
	resp, err := ocrClient.Post("https://ocr-an38.onrender.com/parse-tdr", writer.FormDataContentType(), body)
	if err != nil {
		return nil, fmt.Errorf("OCR API call failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OCR API error %d: %s", resp.StatusCode, string(b))
	}

	var result OCRData
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode OCR response: %w", err)
	}
	return &result, nil
}

// ── PDF Template ──────────────────────────────────────────

var tdrTemplate = template.Must(template.New("tdr").Parse(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Times New Roman', serif; margin: 60px; color: #1a1a1a; }
  .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 20px; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
  .header h2 { font-size: 15px; margin: 4px 0 0; font-weight: normal; }
  .cert-title { text-align: center; font-size: 17px; font-weight: bold; text-decoration: underline; margin: 24px 0 28px; text-transform: uppercase; letter-spacing: 2px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 28px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 13px; }
  th { background-color: #2c3e50; color: white; padding: 10px 14px; text-align: left; font-weight: normal; letter-spacing: 0.5px; }
  td { padding: 9px 14px; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) td { background-color: #f7f9fc; }
  td:first-child { font-weight: bold; width: 40%; color: #444; }
  .blockchain { background: #f0f4f8; border-left: 4px solid #2c3e50; padding: 12px 16px; font-size: 11px; color: #555; margin-bottom: 40px; word-break: break-all; }
  .blockchain strong { display: block; margin-bottom: 4px; color: #2c3e50; font-size: 12px; }
  .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; }
  .signature { text-align: center; width: 180px; }
  .signature .line { border-top: 1px solid #333; margin-bottom: 6px; }
  .qr-block { text-align: center; }
  .qr-block img { width: 100px; height: 100px; display: block; margin: 0 auto 4px; }
  .qr-block .qr-label { font-size: 10px; color: #555; }
  .qr-block .qr-url { font-size: 9px; color: #888; word-break: break-all; max-width: 120px; }
  .watermark { position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: rgba(44,62,80,0.06); font-weight: bold; pointer-events: none; white-space: nowrap; }
</style>
</head>
<body>
<div class="watermark">TDR CERTIFICATE</div>
<div class="header"><h1>Surat Municipal Corporation</h1><h2>Town Development &amp; TDR Cell</h2></div>
<div class="cert-title">Transfer of Development Rights (TDR) Certificate</div>
<div class="meta">
  <span><strong>Certificate No:</strong> {{.CertificateNo}}</span>
  <span><strong>Date of Issue:</strong> {{.DateOfIssue}}</span>
  {{if .FileNo}}<span><strong>File No:</strong> {{.FileNo}}</span>{{end}}
</div>
<table>
  <tr><th colspan="2">Beneficiary Details</th></tr>
  <tr><td>Beneficiary Name</td><td>{{.BeneficiaryName}}</td></tr>
  {{if .Address}}<tr><td>Address</td><td>{{.Address}}</td></tr>{{end}}
  <tr><th colspan="2">Land &amp; TDR Details</th></tr>
  <tr><td>Purpose of Surrender</td><td>{{.Purpose}}</td></tr>
  <tr><td>T.P. Scheme</td><td>{{.TPScheme}}</td></tr>
  <tr><td>Survey No.</td><td>{{.SurveyNo}}</td></tr>
  <tr><td>Surrendered Area</td><td>{{.SurrenderedArea}}</td></tr>
  <tr><td>TDR Issued (FSI)</td><td><strong>{{.TDRIssued}}</strong></td></tr>
</table>
<div class="blockchain">
  <strong>Blockchain Verification</strong>
  Fabric TxID: {{.TxID}}<br/>
  {{if .EthTxHash}}Ethereum TxHash: {{.EthTxHash}}<br/>{{end}}
  Document Hash: {{.Hash}}<br/>
  Fabric Network: Org1MSP &mdash; mychannel
</div>
<div class="footer">
  <div class="signature"><div class="line"></div>Applicant Signature</div>
  {{if .QRCode}}
  <div class="qr-block">
    <img src="data:image/png;base64,{{.QRCode}}" />
    <div class="qr-label">Scan to verify document</div>
    <div class="qr-url">{{.VerifyURL}}</div>
  </div>
  {{end}}
  <div class="signature"><div class="line"></div>Town Planning Officer<br/>Surat Municipal Corporation</div>
</div>
</body>
</html>
`))

func generatePDF(ocr *OCRData, txID, hash, ethTxHash, qrBase64 string) ([]byte, error) {
	verifyURL := fmt.Sprintf("https://tdrfront.vercel.app/verify?docID=%s&hash=%s", ocr.DocID, hash)
	data := TDRTemplateData{OCRData: *ocr, TxID: txID, Hash: hash, EthTxHash: ethTxHash, QRCode: template.URL(qrBase64), VerifyURL: verifyURL}
	var htmlBuf bytes.Buffer
	if err := tdrTemplate.Execute(&htmlBuf, data); err != nil {
		return nil, fmt.Errorf("template render failed: %w", err)
	}
	pdfg, err := wkhtmltopdf.NewPDFGenerator()
	if err != nil {
		return nil, fmt.Errorf("pdf generator init failed: %w", err)
	}
	pdfg.Dpi.Set(300)
	pdfg.Orientation.Set(wkhtmltopdf.OrientationPortrait)
	pdfg.PageSize.Set(wkhtmltopdf.PageSizeA4)
	pdfg.MarginTop.Set(10)
	pdfg.MarginBottom.Set(10)
	page := wkhtmltopdf.NewPageReader(bytes.NewReader(htmlBuf.Bytes()))
	page.EnableLocalFileAccess.Set(true)
	pdfg.AddPage(page)
	if err := pdfg.Create(); err != nil {
		return nil, fmt.Errorf("pdf creation failed: %w", err)
	}
	return pdfg.Bytes(), nil
}

// ── Fabric Gateway ────────────────────────────────────────

func newGateway(fabricID string) (*client.Gateway, error) {
	mspPath := fmt.Sprintf("/home/raj/fabric-dev/fabric-samples/test-network/wallet/%s", fabricID)
	certPEM, err := os.ReadFile(filepath.Join(mspPath, "signcerts/cert.pem"))
	if err != nil {
		return nil, err
	}
	block, _ := pem.Decode(certPEM)
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, err
	}
	id, err := identity.NewX509Identity("Org1MSP", cert)
	if err != nil {
		return nil, err
	}
	files, err := os.ReadDir(filepath.Join(mspPath, "keystore"))
	if err != nil {
		return nil, err
	}
	keyPEM, err := os.ReadFile(filepath.Join(mspPath, "keystore", files[0].Name()))
	if err != nil {
		return nil, err
	}
	keyBlock, _ := pem.Decode(keyPEM)
	privateKey, err := x509.ParsePKCS8PrivateKey(keyBlock.Bytes)
	if err != nil {
		return nil, err
	}
	signer, err := identity.NewPrivateKeySign(privateKey)
	if err != nil {
		return nil, err
	}
	tlsCertPath := "/home/raj/fabric-dev/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
	certPool := x509.NewCertPool()
	tlsCert, _ := os.ReadFile(tlsCertPath)
	certPool.AppendCertsFromPEM(tlsCert)
	creds := credentials.NewTLS(&tls.Config{RootCAs: certPool})
	conn, err := grpc.Dial("localhost:7051", grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, err
	}
	return client.Connect(id, client.WithSign(signer), client.WithClientConnection(conn))
}

func submitTx(gw *client.Gateway, function string, args ...string) (string, error) {
	network := gw.GetNetwork("mychannel")
	contract := network.GetContract("tdr")
	proposal, err := contract.NewProposal(function, client.WithArguments(args...))
	if err != nil {
		return "", err
	}
	txID := proposal.TransactionID()
	endorsed, err := proposal.Endorse()
	if err != nil {
		return "", err
	}
	commit, err := endorsed.Submit()
	if err != nil {
		return "", err
	}
	status, err := commit.Status()
	if err != nil {
		return "", err
	}
	if !status.Successful {
		return "", fmt.Errorf("transaction failed")
	}
	return txID, nil
}

// ── Fabric CA ─────────────────────────────────────────────

func registerUser(fabricID, role, org string) error {
	homeDir := fmt.Sprintf("/tmp/fabric-ca-client/%s", fabricID)
	adminHome := fmt.Sprintf("/tmp/fabric-ca-client/admin-%s", org)

	adminClient := &lib.Client{
		HomeDir: adminHome,
		Config: &lib.ClientConfig{
			URL: "https://localhost:7054",
			TLS: catls.ClientTLSConfig{
				Enabled:   true,
				CertFiles: []string{"/home/raj/fabric-dev/fabric-samples/test-network/organizations/fabric-ca/org1/tls-cert.pem"},
			},
		},
	}
	if err := adminClient.Init(); err != nil {
		return fmt.Errorf("admin client init failed: %w", err)
	}
	adminEnrollment, err := adminClient.Enroll(&api.EnrollmentRequest{Name: "admin", Secret: "adminpw"})
	if err != nil {
		return fmt.Errorf("admin enroll failed: %w", err)
	}
	_, err = adminEnrollment.Identity.Register(&api.RegistrationRequest{
		Name: fabricID, Type: "client", Secret: "pw123", MaxEnrollments: -1,
		Attributes: []api.Attribute{{Name: "role", Value: role, ECert: true}},
	})
	if err != nil {
		return fmt.Errorf("register failed: %w", err)
	}
	userClient := &lib.Client{
		HomeDir: homeDir,
		Config: &lib.ClientConfig{
			URL: "https://localhost:7054",
			TLS: catls.ClientTLSConfig{
				Enabled:   true,
				CertFiles: []string{"/home/raj/fabric-dev/fabric-samples/test-network/organizations/fabric-ca/org1/tls-cert.pem"},
			},
		},
	}
	if err := userClient.Init(); err != nil {
		return fmt.Errorf("user client init failed: %w", err)
	}
	enrollment, err := userClient.Enroll(&api.EnrollmentRequest{Name: fabricID, Secret: "pw123"})
	if err != nil {
		return fmt.Errorf("user enroll failed: %w", err)
	}
	return saveIdentityFromEnrollment(fabricID, enrollment, homeDir)
}

func saveIdentityFromEnrollment(fabricID string, enrollment *lib.EnrollmentResponse, homeDir string) error {
	certPEM := enrollment.Identity.GetECert().Cert()
	if len(certPEM) == 0 {
		return fmt.Errorf("enrollment returned empty cert for %s", fabricID)
	}
	keyDir := filepath.Join(homeDir, "msp/keystore")
	keyFiles, err := os.ReadDir(keyDir)
	if err != nil {
		return fmt.Errorf("failed to read keystore: %w", err)
	}
	if len(keyFiles) == 0 {
		return fmt.Errorf("no key found in keystore: %s", keyDir)
	}
	keyPEM, err := os.ReadFile(filepath.Join(keyDir, keyFiles[0].Name()))
	if err != nil {
		return fmt.Errorf("failed to read key file: %w", err)
	}
	walletPath := "/home/raj/fabric-dev/fabric-samples/test-network/wallet/" + fabricID
	os.MkdirAll(walletPath+"/signcerts", os.ModePerm)
	os.MkdirAll(walletPath+"/keystore", os.ModePerm)
	os.WriteFile(walletPath+"/signcerts/cert.pem", certPEM, 0644)
	os.WriteFile(walletPath+"/keystore/key.pem", keyPEM, 0600)
	fmt.Printf("Identity saved for %s\n", fabricID)
	return nil
}

// ── Seed SuperAdmin ───────────────────────────────────────

func seedSuperAdmin() {
	email    := os.Getenv("SUPERADMIN_EMAIL")
	password := os.Getenv("SUPERADMIN_PASSWORD")
	if email == "" || password == "" {
		log.Println("SUPERADMIN_EMAIL/PASSWORD not set — skipping seed")
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
		log.Printf("SuperAdmin Fabric reg failed: %v", err)
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
		`INSERT INTO users (email, name, fabric_id, role, password_hash, created_at) VALUES ($1,'SuperAdmin',$2,'SUPERADMIN',$3,NOW())`,
		email, fabricID, string(hash),
	)
	log.Printf("✅ SuperAdmin seeded: %s fabricID=%s", email, fabricID)
}

// ── CORS ──────────────────────────────────────────────────

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		allowed := map[string]bool{
			"http://localhost:3000":       true,
			"https://tdrfront.vercel.app": true,
		}
		if origin := r.Header.Get("Origin"); allowed[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func recordHistory(docID, tdrID, action, actor, fromOwner, toOwner, txID string) {
	_, err := db.Exec(
		`INSERT INTO tdr_history (doc_id, tdr_id, action, actor, from_owner, to_owner, fabric_tx_id, timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
		docID, tdrID, action, actor, fromOwner, toOwner, txID,
	)
	if err != nil {
		log.Printf("WARNING: failed to record history: %v", err)
	}
}

// ════════════════════════════════════════════════════════
//  AUTH HANDLERS
// ════════════════════════════════════════════════════════

// POST /register — registers on Fabric CA then sends OTP (no password for users)
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
	if data.Org == "" {
		data.Org = "org1"
	}

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
		http.Error(w, fmt.Sprintf("gateway failed: %v", err), 500)
		return
	}
	defer gw.Close()

	_, err = submitTx(gw, "RegisterIdentity", fabricID)
	if err != nil {
		http.Error(w, fmt.Sprintf("identity registration failed: %v", err), 500)
		return
	}

	_, dbErr := db.Exec(
		`INSERT INTO users (email, name, fabric_id, role, created_at) VALUES ($1,$2,$3,'USER',NOW())`,
		data.Email, data.Name, fabricID,
	)
	if dbErr != nil {
		log.Printf("DB insert error: %v", dbErr)
		http.Error(w, "failed to save user", 500)
		return
	}

	// Send OTP for email verification
	otp := generateOTP()
	otpStore[data.Email] = otp
	otpExpiry[data.Email] = time.Now().Add(5 * time.Minute)
	go func() {
		if err := sendEmail(data.Email, otp); err != nil {
			log.Printf("OTP email failed: %v", err)
		}
	}()

	log.Printf("Registered: email=%s fabricID=%s", data.Email, fabricID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "OTP sent to " + data.Email})
}

// POST /send-otp — send OTP for login
func sendOTPHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		Email string `json:"email"`
	}
	json.NewDecoder(r.Body).Decode(&data)
	if data.Email == "" {
		http.Error(w, "email required", 400)
		return
	}

	// Check user exists
	var exists bool
	db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)`, data.Email).Scan(&exists)
	if !exists {
		http.Error(w, "user not registered", 400)
		return
	}

	// Spam prevention: 1-minute cooldown
	if expiry, ok := otpExpiry[data.Email]; ok && time.Now().Before(expiry.Add(-4*time.Minute)) {
		http.Error(w, "wait before requesting another OTP", 429)
		return
	}

	otp := generateOTP()
	otpStore[data.Email] = otp
	otpExpiry[data.Email] = time.Now().Add(5 * time.Minute)

	go func() {
		if err := sendEmail(data.Email, otp); err != nil {
			log.Printf("OTP email failed for %s: %v", data.Email, err)
		}
	}()

	log.Printf("OTP sent to: %s", data.Email)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "OTP sent successfully"})
}

// POST /verify-otp — verify OTP and return full session
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
		http.Error(w, "invalid OTP", 401)
		return
	}

	var fabricID, name, role string
	err := db.QueryRow(
		`SELECT fabric_id, COALESCE(name,''), role FROM users WHERE email=$1`, data.Email,
	).Scan(&fabricID, &name, &role)
	if err != nil {
		http.Error(w, "user not found", 404)
		return
	}

	delete(otpStore, data.Email)
	delete(otpExpiry, data.Email)

	log.Printf("OTP login: email=%s fabricID=%s role=%s", data.Email, fabricID, role)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "Login successful",
		"fabricID": fabricID,
		"name":     name,
		"role":     role,
	})
}

// POST /admin-login — password-based login for ADMIN/SUPERADMIN
func adminLoginHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "failed to parse JSON", 400)
		return
	}
	if data.Email == "" || data.Password == "" {
		http.Error(w, "email and password required", 400)
		return
	}

	var fabricID, name, role, passwordHash string
	err := db.QueryRow(
		`SELECT fabric_id, COALESCE(name,''), role, COALESCE(password_hash,'') FROM users WHERE email=$1`, data.Email,
	).Scan(&fabricID, &name, &role, &passwordHash)
	if err != nil {
		http.Error(w, "invalid credentials", 401)
		return
	}

	if role != "ADMIN" && role != "SUPERADMIN" {
		http.Error(w, "access denied — admin credentials required", 403)
		return
	}
	if passwordHash == "" {
		http.Error(w, "no password set for this account", 401)
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(data.Password)); err != nil {
		http.Error(w, "invalid credentials", 401)
		return
	}

	log.Printf("Admin login: email=%s role=%s", data.Email, role)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UserSession{FabricID: fabricID, Email: data.Email, Name: name, Role: role})
}

// POST /admin-register — invite-code gated admin registration
func adminRegisterHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		Email      string `json:"email"`
		Name       string `json:"name"`
		Password   string `json:"password"`
		InviteCode string `json:"inviteCode"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "failed to parse JSON", 400)
		return
	}

	expectedCode := os.Getenv("ADMIN_INVITE_CODE")
	if expectedCode == "" {
		expectedCode = "smc-admin-2026"
	}
	if data.InviteCode != expectedCode {
		http.Error(w, "invalid invite code", 403)
		return
	}
	if data.Email == "" || data.Password == "" {
		http.Error(w, "email and password required", 400)
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
		if superEmail := os.Getenv("SUPERADMIN_EMAIL"); superEmail != "" {
			sendSimpleEmail(superEmail, "New Admin Registered",
				fmt.Sprintf("<p>New admin: <b>%s</b> (%s) registered on the portal.</p>", data.Name, data.Email))
		}
	}()

	log.Printf("Admin registered: email=%s fabricID=%s", data.Email, fabricID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Admin account created"})
}

// GET /get-user?email=xxx
func getUserHandler(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "email is required", 400)
		return
	}
	var fabricID, name, role string
	err := db.QueryRow(`SELECT fabric_id, COALESCE(name,''), role FROM users WHERE email=$1`, email).Scan(&fabricID, &name, &role)
	if err != nil {
		http.Error(w, "user not found", 404)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UserSession{FabricID: fabricID, Email: email, Name: name, Role: role})
}

// GET /list-users
func listUsersHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`SELECT email, COALESCE(name,''), fabric_id, role, created_at FROM users ORDER BY created_at DESC`)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()
	type UserRow struct {
		Email     string `json:"email"`
		Name      string `json:"name"`
		FabricID  string `json:"fabricID"`
		Role      string `json:"role"`
		CreatedAt string `json:"createdAt"`
	}
	var users []UserRow
	for rows.Next() {
		var u UserRow
		var ts time.Time
		rows.Scan(&u.Email, &u.Name, &u.FabricID, &u.Role, &ts)
		u.CreatedAt = ts.Format("2 Jan 2006, 15:04")
		users = append(users, u)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"users": users})
}

// ════════════════════════════════════════════════════════
//  DOCUMENT HANDLERS
// ════════════════════════════════════════════════════════

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	fabricID := r.FormValue("fabricID")
	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "failed to read file", 400)
		return
	}
	defer file.Close()

	if handler.Size > 10*1024*1024 {
		http.Error(w, "file too large: max 10MB", 400)
		return
	}

	data, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "failed to read file data", 400)
		return
	}

	detectedType := http.DetectContentType(data[:min512(len(data))])
	ext := strings.ToLower(filepath.Ext(handler.Filename))
	allowedTypes := map[string]bool{"image/jpeg": true, "image/png": true, "application/pdf": true, "application/octet-stream": true}
	allowedExts  := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".pdf": true}

	if !allowedTypes[detectedType] && !allowedExts[ext] {
		http.Error(w, fmt.Sprintf("file type not allowed: %s. Only PDF, JPG, PNG accepted", detectedType), 400)
		return
	}

	docID := generateDocID()
	hash := generateHash(data)

	os.MkdirAll("uploads", os.ModePerm)
	filePath := fmt.Sprintf("uploads/%s_%s", docID, handler.Filename)
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		http.Error(w, "failed to save file", 500)
		return
	}

	gw, err := newGateway(fabricID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer gw.Close()

	txID, err := submitTx(gw, "UploadDocument", docID, hash)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	_, dbErr := db.Exec(
		`INSERT INTO documents (doc_id, filename, hash, file_path, fabric_tx_id, status, created_at) VALUES ($1,$2,$3,$4,$5,'UPLOADED',NOW())`,
		docID, handler.Filename, hash, filePath, txID,
	)
	if dbErr != nil {
		log.Printf("DB INSERT ERROR: %v", dbErr)
		http.Error(w, fmt.Sprintf("db error: %v", dbErr), 500)
		return
	}

	recordHistory(docID, "", "UPLOADED", fabricID, "", fabricID, txID)
	log.Printf("Uploaded: docID=%s", docID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"docID": docID, "txID": txID})
}

// GET /my-documents?fabricID=xxx
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

// GET /download-pdf?docID=xxx
func downloadPDFHandler(w http.ResponseWriter, r *http.Request) {
	docID := r.URL.Query().Get("docID")
	if docID == "" {
		http.Error(w, "docID required", 400)
		return
	}
	var pdfPath, tdrID string
	err := db.QueryRow(`SELECT COALESCE(pdf_path,''), COALESCE(tdr_id,'') FROM documents WHERE doc_id=$1`, docID).Scan(&pdfPath, &tdrID)
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

// ════════════════════════════════════════════════════════
//  TDR ISSUE HANDLERS
// ════════════════════════════════════════════════════════

func requestIssueTDRHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		FabricID string `json:"fabricID"`
		DocID    string `json:"docID"`
		TdrID    string `json:"tdrID"`
		Area     int    `json:"area"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "failed to parse JSON", 400)
		return
	}
	if data.FabricID == "" || data.DocID == "" || data.TdrID == "" || data.Area == 0 {
		http.Error(w, "fabricID, docID, tdrID and area are required", 400)
		return
	}
	var filePath string
	err := db.QueryRow(`SELECT file_path FROM documents WHERE doc_id=$1`, data.DocID).Scan(&filePath)
	if err != nil {
		http.Error(w, fmt.Sprintf("document not found: %s", data.DocID), 404)
		return
	}
	requestID := fmt.Sprintf("IREQ-%s", generateDocID())
	gw, err := newGateway(data.FabricID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer gw.Close()
	txID, err := submitTx(gw, "RequestIssueTDR", requestID, data.DocID, data.TdrID, fmt.Sprintf("%d", data.Area))
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	db.Exec(
		`INSERT INTO issue_requests (request_id, doc_id, tdr_id, owner, area, status, fabric_tx_id, created_at) VALUES ($1,$2,$3,$4,$5,'PENDING',$6,NOW())`,
		requestID, data.DocID, data.TdrID, data.FabricID, data.Area, txID,
	)
	log.Printf("Issue request created: %s", requestID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"requestID": requestID, "txID": txID, "status": "PENDING"})
}

func getPendingIssueRequestsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`SELECT request_id, doc_id, tdr_id, owner, area, status, fabric_tx_id, created_at FROM issue_requests WHERE status='PENDING' ORDER BY created_at DESC`)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()
	type IssueReq struct {
		RequestID string `json:"requestID"`
		DocID     string `json:"docID"`
		TdrID     string `json:"tdrID"`
		Owner     string `json:"owner"`
		Area      int    `json:"area"`
		Status    string `json:"status"`
		TxID      string `json:"txID"`
		CreatedAt string `json:"createdAt"`
	}
	var requests []IssueReq
	for rows.Next() {
		var req IssueReq
		var ts time.Time
		rows.Scan(&req.RequestID, &req.DocID, &req.TdrID, &req.Owner, &req.Area, &req.Status, &req.TxID, &ts)
		req.CreatedAt = ts.Format("2 Jan 2006, 15:04")
		requests = append(requests, req)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"requests": requests})
}

func approveIssueTDRHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		AdminFabricID string `json:"adminFabricID"`
		RequestID     string `json:"requestID"`
	}
	json.NewDecoder(r.Body).Decode(&data)

	var docID, tdrID, owner string
	var area int
	err := db.QueryRow(`SELECT doc_id, tdr_id, owner, area FROM issue_requests WHERE request_id=$1 AND status='PENDING'`, data.RequestID).Scan(&docID, &tdrID, &owner, &area)
	if err != nil {
		http.Error(w, "request not found or already resolved", 404)
		return
	}

	gw, err := newGateway(data.AdminFabricID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer gw.Close()

	txID, err := submitTx(gw, "ApproveIssueTDR", data.RequestID, owner)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	db.Exec(`UPDATE documents SET tdr_id=$1, status='TDR_ISSUED' WHERE doc_id=$2`, tdrID, docID)
	db.Exec(`UPDATE issue_requests SET status='APPROVED', fabric_tx_id=$1, resolved_at=NOW(), resolved_by=$2 WHERE request_id=$3`, txID, data.AdminFabricID, data.RequestID)
	recordHistory(docID, tdrID, "TDR_ISSUED", data.AdminFabricID, "", owner, txID)

	// ✉️ Email notification to owner
	go func() {
		var ownerEmail string
		db.QueryRow(`SELECT email FROM users WHERE fabric_id=$1`, owner).Scan(&ownerEmail)
		if ownerEmail != "" {
			sendSimpleEmail(ownerEmail, "✅ TDR Issuance Approved",
				fmt.Sprintf(`<h2 style="color:#10b981">TDR Issuance Approved 🎉</h2>
				<p>Your TDR <b>%s</b> for document <b>%s</b> has been approved and minted on the blockchain.</p>
				<p><a href="https://tdrfront.vercel.app/dashboard">View your dashboard →</a></p>`, tdrID, docID))
		}
	}()

	log.Printf("Issue approved: %s txID=%s", data.RequestID, txID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"requestID": data.RequestID, "tdrID": tdrID, "txID": txID, "status": "APPROVED"})
}

func rejectIssueTDRHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		AdminFabricID string `json:"adminFabricID"`
		RequestID     string `json:"requestID"`
		Reason        string `json:"reason"`
	}
	json.NewDecoder(r.Body).Decode(&data)
	if data.Reason == "" {
		data.Reason = "Rejected by admin"
	}
	var docID, owner string
	err := db.QueryRow(`SELECT doc_id, owner FROM issue_requests WHERE request_id=$1 AND status='PENDING'`, data.RequestID).Scan(&docID, &owner)
	if err != nil {
		http.Error(w, "request not found or already resolved", 404)
		return
	}
	gw, err := newGateway(data.AdminFabricID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer gw.Close()
	txID, err := submitTx(gw, "RejectIssueTDR", data.RequestID, data.Reason)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	db.Exec(`UPDATE issue_requests SET status='REJECTED', reason=$1, fabric_tx_id=$2, resolved_at=NOW(), resolved_by=$3 WHERE request_id=$4`, data.Reason, txID, data.AdminFabricID, data.RequestID)

	// ✉️ Email notification
	go func() {
		var ownerEmail string
		db.QueryRow(`SELECT email FROM users WHERE fabric_id=$1`, owner).Scan(&ownerEmail)
		if ownerEmail != "" {
			sendSimpleEmail(ownerEmail, "TDR Issuance Request Rejected",
				fmt.Sprintf(`<h2>TDR Issuance Rejected</h2><p>Reason: <b>%s</b></p><p><a href="https://tdrfront.vercel.app/dashboard">View dashboard →</a></p>`, data.Reason))
		}
	}()

	log.Printf("Issue rejected: %s", data.RequestID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"requestID": data.RequestID, "txID": txID, "status": "REJECTED", "reason": data.Reason})
}

// ════════════════════════════════════════════════════════
//  TRANSFER HANDLERS
// ════════════════════════════════════════════════════════

func requestTransferHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		FabricID string `json:"fabricID"`
		DocID    string `json:"docID"`
		NewOwner string `json:"newOwner"`
	}
	json.NewDecoder(r.Body).Decode(&data)
	if data.FabricID == "" || data.DocID == "" || data.NewOwner == "" {
		http.Error(w, "fabricID, docID and newOwner are required", 400)
		return
	}
	var tdrID string
	err := db.QueryRow(`SELECT tdr_id FROM documents WHERE doc_id=$1`, data.DocID).Scan(&tdrID)
	if err != nil || tdrID == "" {
		http.Error(w, "document or TDR not found", 404)
		return
	}
	requestID := fmt.Sprintf("REQ-%s", generateDocID())
	gw, err := newGateway(data.FabricID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer gw.Close()
	txID, err := submitTx(gw, "RequestTransfer", requestID, tdrID, data.NewOwner)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	db.Exec(
		`INSERT INTO transfer_requests (request_id, doc_id, tdr_id, from_owner, to_owner, status, fabric_tx_id, created_at) VALUES ($1,$2,$3,$4,$5,'PENDING',$6,NOW())`,
		requestID, data.DocID, tdrID, data.FabricID, data.NewOwner, txID,
	)
	recordHistory(data.DocID, tdrID, "TRANSFER_REQUESTED", data.FabricID, data.FabricID, data.NewOwner, txID)
	log.Printf("Transfer request created: %s", requestID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"requestID": requestID, "txID": txID, "status": "PENDING"})
}

func getPendingRequestsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`SELECT request_id, doc_id, tdr_id, from_owner, to_owner, status, fabric_tx_id, created_at FROM transfer_requests WHERE status='PENDING' ORDER BY created_at DESC`)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()
	type Request struct {
		RequestID string `json:"requestID"`
		DocID     string `json:"docID"`
		TdrID     string `json:"tdrID"`
		FromOwner string `json:"fromOwner"`
		ToOwner   string `json:"toOwner"`
		Status    string `json:"status"`
		TxID      string `json:"txID"`
		CreatedAt string `json:"createdAt"`
	}
	var requests []Request
	for rows.Next() {
		var req Request
		var ts time.Time
		rows.Scan(&req.RequestID, &req.DocID, &req.TdrID, &req.FromOwner, &req.ToOwner, &req.Status, &req.TxID, &ts)
		req.CreatedAt = ts.Format("2 Jan 2006, 15:04")
		requests = append(requests, req)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"requests": requests})
}

func approveTransferHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		AdminFabricID string `json:"adminFabricID"`
		RequestID     string `json:"requestID"`
	}
	json.NewDecoder(r.Body).Decode(&data)

	var docID, tdrID, fromOwner, toOwner string
	err := db.QueryRow(`SELECT doc_id, tdr_id, from_owner, to_owner FROM transfer_requests WHERE request_id=$1 AND status='PENDING'`, data.RequestID).Scan(&docID, &tdrID, &fromOwner, &toOwner)
	if err != nil {
		http.Error(w, "request not found or already resolved", 404)
		return
	}

	var filePath string
	db.QueryRow(`SELECT file_path FROM documents WHERE doc_id=$1`, docID).Scan(&filePath)

	gw, err := newGateway(data.AdminFabricID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer gw.Close()

	txID, err := submitTx(gw, "ApproveTransfer", data.RequestID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	log.Printf("APPROVE: request=%s txID=%s", data.RequestID, txID)

	// OCR + PDF generation
	var pdfBytes []byte
	var pdfPath string

	if filePath != "" {
		ocrData, ocrErr := callOCRAPI(filePath, docID)
		if ocrErr == nil {
			ocrData.BeneficiaryName = toOwner
			fileBytes, _ := os.ReadFile(filePath)
			hash := generateHash(fileBytes)
			ethTxHash, _ := anchorToEVM(docID, hash, txID)
			verifyURL := fmt.Sprintf("https://tdrfront.vercel.app/verify?docID=%s&hash=%s", docID, hash)
			qrBase64, _ := generateQRCode(verifyURL)
			pdfBytes, _ = generatePDF(ocrData, txID, hash, ethTxHash, qrBase64)

			if len(pdfBytes) > 0 {
				os.MkdirAll("pdfs", os.ModePerm)
				pdfPath = fmt.Sprintf("pdfs/%s_approved_%s.pdf", docID, toOwner)
				os.WriteFile(pdfPath, pdfBytes, 0644)
				ocrJSON, _ := json.Marshal(ocrData)
				db.Exec(`UPDATE documents SET fabric_tx_id=$1, pdf_path=$2, ocr_data=$3, status='TRANSFERRED' WHERE doc_id=$4`, txID, pdfPath, string(ocrJSON), docID)
			}
		}
	}

	db.Exec(`UPDATE transfer_requests SET status='APPROVED', fabric_tx_id=$1, resolved_at=NOW(), resolved_by=$2 WHERE request_id=$3`, txID, data.AdminFabricID, data.RequestID)
	recordHistory(docID, tdrID, "TRANSFERRED", data.AdminFabricID, fromOwner, toOwner, txID)

	// ✉️ Email new owner with PDF attachment
	go func() {
		var newOwnerEmail string
		db.QueryRow(`SELECT email FROM users WHERE fabric_id=$1`, toOwner).Scan(&newOwnerEmail)
		if newOwnerEmail != "" && pdfPath != "" {
			sendEmailWithAttachment(newOwnerEmail, "✅ TDR Transferred to You — Certificate Attached",
				fmt.Sprintf(`<h2 style="color:#10b981">TDR Transferred to You ✅</h2>
				<p>TDR <b>%s</b> has been transferred to you. Your certificate is attached.</p>
				<p><a href="https://tdrfront.vercel.app/dashboard">Download from dashboard →</a></p>`, tdrID),
				pdfPath)
		}
	}()

	// ✉️ Email old owner
	go func() {
		var oldOwnerEmail string
		db.QueryRow(`SELECT email FROM users WHERE fabric_id=$1`, fromOwner).Scan(&oldOwnerEmail)
		if oldOwnerEmail != "" {
			sendSimpleEmail(oldOwnerEmail, "TDR Transfer Completed",
				fmt.Sprintf(`<h2>TDR Transfer Completed</h2><p>Your TDR <b>%s</b> has been transferred.</p>`, tdrID))
		}
	}()

	// Return PDF bytes directly to admin who approved (so admin sees it too)
	if len(pdfBytes) > 0 {
		w.Header().Set("Content-Type", "application/pdf")
		w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="TDR_%s.pdf"`, tdrID))
		w.Header().Set("X-Tx-ID", txID)
		w.Header().Set("X-Request-ID", data.RequestID)
		w.Write(pdfBytes)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"requestID": data.RequestID, "txID": txID, "status": "APPROVED"})
}

func rejectTransferHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		AdminFabricID string `json:"adminFabricID"`
		RequestID     string `json:"requestID"`
		Reason        string `json:"reason"`
	}
	json.NewDecoder(r.Body).Decode(&data)
	if data.Reason == "" {
		data.Reason = "Rejected by admin"
	}
	var fromOwner, tdrID string
	db.QueryRow(`SELECT from_owner, tdr_id FROM transfer_requests WHERE request_id=$1`, data.RequestID).Scan(&fromOwner, &tdrID)

	gw, err := newGateway(data.AdminFabricID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer gw.Close()
	txID, err := submitTx(gw, "RejectTransfer", data.RequestID, data.Reason)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	db.Exec(`UPDATE transfer_requests SET status='REJECTED', reason=$1, fabric_tx_id=$2, resolved_at=NOW(), resolved_by=$3 WHERE request_id=$4`, data.Reason, txID, data.AdminFabricID, data.RequestID)

	// ✉️ Notify requester
	go func() {
		var ownerEmail string
		db.QueryRow(`SELECT email FROM users WHERE fabric_id=$1`, fromOwner).Scan(&ownerEmail)
		if ownerEmail != "" {
			sendSimpleEmail(ownerEmail, "TDR Transfer Request Rejected",
				fmt.Sprintf(`<h2>Transfer Rejected</h2><p>Reason: <b>%s</b></p>`, data.Reason))
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"requestID": data.RequestID, "txID": txID, "status": "REJECTED"})
}

// GET /my-requests?fabricID=xxx
func myRequestsHandler(w http.ResponseWriter, r *http.Request) {
	fabricID := r.URL.Query().Get("fabricID")
	if fabricID == "" {
		http.Error(w, "fabricID required", 400)
		return
	}
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
		`SELECT request_id, doc_id, tdr_id, from_owner, to_owner, status, fabric_tx_id, created_at,
		        COALESCE(to_char(resolved_at,'DD Mon YYYY, HH24:MI'),''), COALESCE(reason,'')
		 FROM transfer_requests WHERE from_owner=$1 ORDER BY created_at DESC`, fabricID,
	)
	defer tRows.Close()
	var tReqs []TReq
	for tRows.Next() {
		var req TReq
		var ts time.Time
		tRows.Scan(&req.RequestID, &req.DocID, &req.TdrID, &req.FromOwner, &req.ToOwner, &req.Status, &req.TxID, &ts, &req.ResolvedAt, &req.Reason)
		req.CreatedAt = ts.Format("2 Jan 2006, 15:04")
		tReqs = append(tReqs, req)
	}
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
		`SELECT request_id, doc_id, tdr_id, owner, area, status, fabric_tx_id, created_at,
		        COALESCE(to_char(resolved_at,'DD Mon YYYY, HH24:MI'),''), COALESCE(reason,'')
		 FROM issue_requests WHERE owner=$1 ORDER BY created_at DESC`, fabricID,
	)
	defer iRows.Close()
	var iReqs []IReq
	for iRows.Next() {
		var req IReq
		var ts time.Time
		iRows.Scan(&req.RequestID, &req.DocID, &req.TdrID, &req.Owner, &req.Area, &req.Status, &req.TxID, &ts, &req.ResolvedAt, &req.Reason)
		req.CreatedAt = ts.Format("2 Jan 2006, 15:04")
		iReqs = append(iReqs, req)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"transferRequests": tReqs, "issueRequests": iReqs})
}

// ════════════════════════════════════════════════════════
//  ADMIN HANDLERS
// ════════════════════════════════════════════════════════

func promoteToAdminHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		SuperAdminFabricID string `json:"superAdminFabricID"`
		TargetFabricID     string `json:"targetFabricID"`
	}
	json.NewDecoder(r.Body).Decode(&data)
	gw, err := newGateway(data.SuperAdminFabricID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer gw.Close()
	txID, err := submitTx(gw, "PromoteToAdmin", data.TargetFabricID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	// Set password for promoted user so they can use admin login
	// They'll need to reset via SuperAdmin — just give them a temp one
	tempHash, _ := bcrypt.GenerateFromPassword([]byte("ChangeMe123!"), bcrypt.DefaultCost)
	db.Exec(`UPDATE users SET role='ADMIN', password_hash=$1 WHERE fabric_id=$2`, string(tempHash), data.TargetFabricID)

	// Notify them
	go func() {
		var email, name string
		db.QueryRow(`SELECT email, COALESCE(name,'') FROM users WHERE fabric_id=$1`, data.TargetFabricID).Scan(&email, &name)
		if email != "" {
			sendSimpleEmail(email, "You have been promoted to Admin",
				fmt.Sprintf(`<h2>Admin Access Granted 🎉</h2>
				<p>Hi %s, you have been promoted to <b>Admin</b> on the SMC e-TDR portal.</p>
				<p>Your temporary password is: <b>ChangeMe123!</b></p>
				<p>Please log in via <a href="https://tdrfront.vercel.app/admin-login">Admin Portal</a> and change your password immediately.</p>`, name))
		}
	}()

	log.Printf("Promoted %s to ADMIN txID=%s", data.TargetFabricID, txID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"targetFabricID": data.TargetFabricID, "newRole": "ADMIN", "txID": txID})
}

func getTDRHandler(w http.ResponseWriter, r *http.Request) {
	fabricID := r.URL.Query().Get("fabricID")
	tdrID := r.URL.Query().Get("tdrID")
	if fabricID == "" || tdrID == "" {
		http.Error(w, "fabricID and tdrID are required", 400)
		return
	}
	gw, err := newGateway(fabricID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer gw.Close()
	result, err := gw.GetNetwork("mychannel").GetContract("tdr").EvaluateTransaction("GetTDR", tdrID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(result)
}

func anchorConfirmedHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		FabricTxID string `json:"fabricTxID"`
		Leaf       string `json:"leaf"`
		EthTxHash  string `json:"ethTxHash"`
		MerkleRoot string `json:"merkleRoot"`
		BatchID    string `json:"batchID"`
	}
	json.NewDecoder(r.Body).Decode(&data)
	_, err := db.Exec(`UPDATE documents SET eth_tx_hash=$1, leaf=$2, status='ANCHORED', merkle_root=$3, batch_id=$4 WHERE fabric_tx_id=$5`,
		data.EthTxHash, data.Leaf, data.MerkleRoot, data.BatchID, data.FabricTxID)
	if err != nil {
		http.Error(w, "db error", 500)
		return
	}
	log.Printf("ANCHORED: fabricTxID=%s ethTxHash=%s", data.FabricTxID, data.EthTxHash)
	w.Write([]byte("ok"))
}

func verifyHandler(w http.ResponseWriter, r *http.Request) {
	docID := r.URL.Query().Get("docID")
	hash := r.URL.Query().Get("hash")
	if docID == "" || hash == "" {
		http.Error(w, "docID and hash are required", 400)
		return
	}
	var storedHash, status, ethTxHash, merkleRoot, batchID string
	err := db.QueryRow(`SELECT hash, status, COALESCE(eth_tx_hash,''), COALESCE(merkle_root,''), COALESCE(batch_id,'') FROM documents WHERE doc_id=$1`, docID).
		Scan(&storedHash, &status, &ethTxHash, &merkleRoot, &batchID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"valid": false, "reason": "document not found"})
		return
	}
	valid := storedHash == hash
	reason := "Document is authentic and unmodified"
	if !valid {
		reason = "Document hash mismatch — possible tampering detected"
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"valid": valid, "status": status, "docID": docID, "ethTxHash": ethTxHash, "merkleRoot": merkleRoot, "batchID": batchID, "reason": reason})
}

func historyHandler(w http.ResponseWriter, r *http.Request) {
	docID := r.URL.Query().Get("docID")
	if docID == "" {
		http.Error(w, "docID is required", 400)
		return
	}
	rows, err := db.Query(`SELECT action, actor, from_owner, to_owner, fabric_tx_id, timestamp FROM tdr_history WHERE doc_id=$1 ORDER BY timestamp ASC`, docID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()
	type HistoryEntry struct {
		Action    string `json:"action"`
		Actor     string `json:"actor"`
		FromOwner string `json:"fromOwner"`
		ToOwner   string `json:"toOwner"`
		TxID      string `json:"txID"`
		Timestamp string `json:"timestamp"`
	}
	var history []HistoryEntry
	for rows.Next() {
		var e HistoryEntry
		var ts time.Time
		rows.Scan(&e.Action, &e.Actor, &e.FromOwner, &e.ToOwner, &e.TxID, &ts)
		e.Timestamp = ts.Format("2 Jan 2006, 15:04")
		history = append(history, e)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"docID": docID, "history": history})
}

func getMutationGraphHandler(w http.ResponseWriter, r *http.Request) {
	docID := r.URL.Query().Get("docID")
	if docID == "" {
		http.Error(w, "docID is required", 400)
		return
	}
	rows, err := db.Query(`SELECT action, actor, from_owner, to_owner, fabric_tx_id, timestamp FROM tdr_history WHERE doc_id=$1 ORDER BY timestamp ASC`, docID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()
	nodeMap := make(map[string]bool)
	var nodes, edges []map[string]interface{}
	var chain []string
	first := true
	for rows.Next() {
		var action, actor, fromOwner, toOwner, txID string
		var ts time.Time
		rows.Scan(&action, &actor, &fromOwner, &toOwner, &txID, &ts)
		timestamp := ts.Format("2 Jan 2006, 15:04")
		if first && fromOwner != "" {
			chain = append(chain, fromOwner)
			first = false
		}
		if toOwner != "" {
			chain = append(chain, toOwner)
		}
		if fromOwner != "" && !nodeMap[fromOwner] {
			nodes = append(nodes, map[string]interface{}{"id": fromOwner, "label": fromOwner})
			nodeMap[fromOwner] = true
		}
		if toOwner != "" && !nodeMap[toOwner] {
			nodes = append(nodes, map[string]interface{}{"id": toOwner, "label": toOwner})
			nodeMap[toOwner] = true
		}
		if fromOwner != "" && toOwner != "" {
			edges = append(edges, map[string]interface{}{"source": fromOwner, "target": toOwner, "label": timestamp, "action": action, "txID": txID})
		}
	}
	log.Printf("Mutation chain: %s", strings.Join(chain, " → "))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"docID": docID, "chain": strings.Join(chain, " → "), "nodes": nodes, "edges": edges})
}

// ════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════

func main() {
	godotenv.Load()
	initDB()

	// Seed SuperAdmin from .env on first run
	go seedSuperAdmin()

	mux := http.NewServeMux()

	// Auth
	mux.HandleFunc("/register",       registerHandler)
	mux.HandleFunc("/send-otp",       sendOTPHandler)
	mux.HandleFunc("/verify-otp",     verifyOTPHandler)
	mux.HandleFunc("/admin-login",    adminLoginHandler)
	mux.HandleFunc("/admin-register", adminRegisterHandler)
	mux.HandleFunc("/get-user",       getUserHandler)
	mux.HandleFunc("/list-users",     listUsersHandler)

	// Documents
	mux.HandleFunc("/upload",         uploadHandler)
	mux.HandleFunc("/my-documents",   myDocumentsHandler)
	mux.HandleFunc("/download-pdf",   downloadPDFHandler)

	// TDR Issue
	mux.HandleFunc("/request-issue-tdr",      requestIssueTDRHandler)
	mux.HandleFunc("/pending-issue-requests", getPendingIssueRequestsHandler)
	mux.HandleFunc("/approve-issue-tdr",      approveIssueTDRHandler)
	mux.HandleFunc("/reject-issue-tdr",       rejectIssueTDRHandler)

	// Transfer
	mux.HandleFunc("/request-transfer",  requestTransferHandler)
	mux.HandleFunc("/pending-requests",  getPendingRequestsHandler)
	mux.HandleFunc("/approve-transfer",  approveTransferHandler)
	mux.HandleFunc("/reject-transfer",   rejectTransferHandler)
	mux.HandleFunc("/my-requests",       myRequestsHandler)

	// Admin
	mux.HandleFunc("/promote-to-admin", promoteToAdminHandler)
	mux.HandleFunc("/get-tdr",          getTDRHandler)

	// Blockchain / Verify
	mux.HandleFunc("/anchor-confirmed", anchorConfirmedHandler)
	mux.HandleFunc("/verify",           verifyHandler)
	mux.HandleFunc("/history",          historyHandler)
	mux.HandleFunc("/mutation-graph",   getMutationGraphHandler)

	handler := corsMiddleware(mux)
	fmt.Println("Server running at :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
