package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// newTestApp returns an App with masterkey derived from password, ready for crypto operations.
func newTestApp(password string) *App {
	a := &App{}
	a.startup(context.Background())
	a.masterkey = deriveKey(password)
	return a
}

// --- deriveKey ---

func TestDeriveKeyDeterministic(t *testing.T) {
	key1 := deriveKey("mypassword")
	key2 := deriveKey("mypassword")
	if string(key1) != string(key2) {
		t.Fatal("same password must always produce the same key")
	}
	if len(key1) != 32 {
		t.Fatalf("expected 32-byte key, got %d bytes", len(key1))
	}
}

func TestDeriveKeyDifferentPasswords(t *testing.T) {
	key1 := deriveKey("password1")
	key2 := deriveKey("password2")
	if string(key1) == string(key2) {
		t.Fatal("different passwords must produce different keys")
	}
}

// --- encryptData / decryptData ---

func TestEncryptDecryptRoundtrip(t *testing.T) {
	a := newTestApp("testpassword")
	original := []byte("hello, tape!")

	nonce, cipher, err := a.encryptData(a.masterkey, original)
	if err != nil {
		t.Fatal(err)
	}

	plaintext, err := a.decryptData(a.masterkey, nonce, cipher)
	if err != nil {
		t.Fatal(err)
	}

	if string(plaintext) != string(original) {
		t.Fatalf("expected %q, got %q", original, plaintext)
	}
}

func TestEncryptProducesUniqueNoncesAndCiphertexts(t *testing.T) {
	a := newTestApp("testpassword")
	data := []byte("same content")

	nonce1, cipher1, _ := a.encryptData(a.masterkey, data)
	nonce2, cipher2, _ := a.encryptData(a.masterkey, data)

	if string(nonce1) == string(nonce2) {
		t.Fatal("nonces must be unique per encryption call")
	}
	if string(cipher1) == string(cipher2) {
		t.Fatal("ciphertexts must differ for same input due to unique nonces")
	}
}

func TestDecryptWithWrongKeyFails(t *testing.T) {
	a := newTestApp("correctpassword")

	nonce, cipher, err := a.encryptData(a.masterkey, []byte("secret"))
	if err != nil {
		t.Fatal(err)
	}

	wrongKey := deriveKey("wrongpassword")
	_, err = a.decryptData(wrongKey, nonce, cipher)
	if err == nil {
		t.Fatal("decryption with wrong key must fail")
	}
}

// --- encryptName / decryptMDE1 ---

func TestEncryptNameDecryptRoundtrip(t *testing.T) {
	tests := []struct {
		name  string
		isDir bool
	}{
		{"mynote.md", false},
		{"my folder", true},
		{"notes with spaces.md", false},
		{"deeply nested note.md", false},
		{"subfolder", true},
	}

	a := newTestApp("testpassword")

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encrypted, err := a.encryptName(tt.name, tt.isDir)
			if err != nil {
				t.Fatal(err)
			}

			if len(encrypted) < 4 || encrypted[:4] != a.cryptVersionMDE1 {
				t.Fatalf("expected %q prefix, got %q", a.cryptVersionMDE1, encrypted[:4])
			}

			if !tt.isDir && !isMDE(encrypted) {
				t.Fatalf("file must have .mde extension, got %q", encrypted)
			}
			if tt.isDir && isMDE(encrypted) {
				t.Fatalf("directory must not have .mde extension, got %q", encrypted)
			}

			decrypted, err := a.decryptMDE1([]byte(stripFileExt(encrypted)), true)
			if err != nil {
				t.Fatal(err)
			}

			expectedName := tt.name
			if !tt.isDir {
				expectedName = stripFileExt(tt.name)
			}
			if string(decrypted) != expectedName {
				t.Fatalf("expected %q, got %q", expectedName, string(decrypted))
			}
		})
	}
}

func TestEncryptNameProducesUniqueCiphertexts(t *testing.T) {
	a := newTestApp("testpassword")

	enc1, _ := a.encryptName("note.md", false)
	enc2, _ := a.encryptName("note.md", false)

	if enc1 == enc2 {
		t.Fatal("encrypting the same name twice must produce different ciphertexts")
	}
}

func TestDecryptMDE1RejectsBadPrefix(t *testing.T) {
	a := newTestApp("testpassword")

	_, err := a.decryptMDE1([]byte("BAD1somepayload"), true)
	if err == nil {
		t.Fatal("decryptMDE1 must reject payloads without the correct version prefix")
	}
}

// --- buildEncryptedPaths ---

func TestBuildEncryptedPathsFlat(t *testing.T) {
	nodes := []PathPart{
		{pathParts: []string{"docs"}, lastOri: "docs", lastEnc: "ENC_docs"},
		{pathParts: []string{"notes"}, lastOri: "notes", lastEnc: "ENC_notes"},
	}

	result := buildEncryptedPaths(nodes)

	if result[0].encPath != "ENC_docs" {
		t.Fatalf("expected ENC_docs, got %q", result[0].encPath)
	}
	if result[1].encPath != "ENC_notes" {
		t.Fatalf("expected ENC_notes, got %q", result[1].encPath)
	}
}

func TestBuildEncryptedPathsNested(t *testing.T) {
	nodes := []PathPart{
		{pathParts: []string{"docs"}, lastOri: "docs", lastEnc: "ENC_docs"},
		{pathParts: []string{"docs", "sub"}, lastOri: "sub", lastEnc: "ENC_sub"},
		{pathParts: []string{"docs", "sub", "note.mde"}, lastOri: "note.mde", lastEnc: "ENC_note.mde"},
	}

	result := buildEncryptedPaths(nodes)

	expected := filepath.Join("ENC_docs", "ENC_sub", "ENC_note.mde")
	if result[2].encPath != expected {
		t.Fatalf("expected %q, got %q", expected, result[2].encPath)
	}
}

func TestBuildEncryptedPathsDuplicateNames(t *testing.T) {
	// parent and child share the same original name — the search must not confuse them
	nodes := []PathPart{
		{pathParts: []string{"a"}, lastOri: "a", lastEnc: "ENC_a1"},
		{pathParts: []string{"a", "a"}, lastOri: "a", lastEnc: "ENC_a2"},
		{pathParts: []string{"a", "a", "file.mde"}, lastOri: "file.mde", lastEnc: "ENC_file.mde"},
	}

	result := buildEncryptedPaths(nodes)

	expected := filepath.Join("ENC_a1", "ENC_a2", "ENC_file.mde")
	if result[2].encPath != expected {
		t.Fatalf("expected %q, got %q", expected, result[2].encPath)
	}
}

func TestBuildEncryptedPathsMultipleSiblings(t *testing.T) {
	nodes := []PathPart{
		{pathParts: []string{"docs"}, lastOri: "docs", lastEnc: "ENC_docs"},
		{pathParts: []string{"docs", "a.mde"}, lastOri: "a.mde", lastEnc: "ENC_a.mde"},
		{pathParts: []string{"docs", "b.mde"}, lastOri: "b.mde", lastEnc: "ENC_b.mde"},
		{pathParts: []string{"docs", "b.mde"}, lastOri: "b.mde", lastEnc: "ENC_b2.mde"}, // same name, different enc
	}

	result := buildEncryptedPaths(nodes)

	if result[1].encPath != filepath.Join("ENC_docs", "ENC_a.mde") {
		t.Fatalf("unexpected encPath for a: %q", result[1].encPath)
	}
	if result[2].encPath != filepath.Join("ENC_docs", "ENC_b.mde") {
		t.Fatalf("unexpected encPath for b: %q", result[2].encPath)
	}
}

// --- config diff / protected keys ---

func TestHasConfigChangesIgnoresWhitespace(t *testing.T) {
	a := &App{}
	orig := `{"theme":"dark","privacyMode":true}`
	edited := "{\n  \"theme\": \"dark\",\n  \"privacyMode\": true\n}"
	changed, err := a.HasConfigChanges(orig, edited)
	if err != nil {
		t.Fatal(err)
	}
	if changed {
		t.Fatal("pure formatting changes must not be reported as config changes")
	}
}

func TestHasConfigChangesDetectsValueChange(t *testing.T) {
	a := &App{}
	changed, err := a.HasConfigChanges(`{"theme":"dark"}`, `{"theme":"light"}`)
	if err != nil {
		t.Fatal(err)
	}
	if !changed {
		t.Fatal("a value change must be reported")
	}
}

func TestGetConfigProtectedKeyChangesNone(t *testing.T) {
	a := &App{}
	changed, err := a.GetConfigProtectedKeyChanges(
		`{"theme":"dark","privacyMode":true,"check":"aGk=","nonceCheck":"bm8="}`,
		`{"theme":"light","privacyMode":true,"check":"aGk=","nonceCheck":"bm8="}`,
	)
	if err != nil {
		t.Fatal(err)
	}
	if len(changed) != 0 {
		t.Fatalf("expected no protected changes, got %v", changed)
	}
}

func TestGetConfigProtectedKeyChangesPrivacyMode(t *testing.T) {
	a := &App{}
	changed, err := a.GetConfigProtectedKeyChanges(
		`{"privacyMode":true,"check":"aGk=","nonceCheck":"bm8="}`,
		`{"privacyMode":false,"check":"aGk=","nonceCheck":"bm8="}`,
	)
	if err != nil {
		t.Fatal(err)
	}
	if len(changed) != 1 || changed[0] != "privacyMode" {
		t.Fatalf("expected [privacyMode], got %v", changed)
	}
}

func TestGetConfigProtectedKeyChangesContent(t *testing.T) {
	a := &App{}
	changed, err := a.GetConfigProtectedKeyChanges(
		`{"privacyMode":true,"check":"aGk=","nonceCheck":"bm8="}`,
		`{"privacyMode":true,"check":"Y2hhbmdlZA==","nonceCheck":"bm8="}`,
	)
	if err != nil {
		t.Fatal(err)
	}
	if len(changed) != 1 || changed[0] != "check" {
		t.Fatalf("expected [check], got %v", changed)
	}
}

func TestGetConfigProtectedKeyChangesRemoved(t *testing.T) {
	a := &App{}
	changed, err := a.GetConfigProtectedKeyChanges(
		`{"privacyMode":true,"check":"aGk=","nonceCheck":"bm8="}`,
		`{"privacyMode":true}`,
	)
	if err != nil {
		t.Fatal(err)
	}
	if len(changed) != 2 {
		t.Fatalf("expected [check nonceCheck], got %v", changed)
	}
}

func TestGetConfigDiffIncludesHeadersAndMarkers(t *testing.T) {
	a := &App{}
	diff, err := a.GetConfigDiff(`{"theme":"dark"}`, `{"theme":"light"}`)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(diff, "--- a/tape.json\n+++ b/tape.json\n") {
		t.Fatalf("expected git-style headers, got:\n%s", diff)
	}
	if !strings.Contains(diff, "\n-  \"theme\": \"dark\"") || !strings.Contains(diff, "\n+  \"theme\": \"light\"") {
		t.Fatalf("expected -/+ lines, got:\n%s", diff)
	}
}

func TestGetConfigDiffNoChangesEmpty(t *testing.T) {
	a := &App{}
	diff, err := a.GetConfigDiff(`{"theme":"dark"}`, `{"theme":"dark"}`)
	if err != nil {
		t.Fatal(err)
	}
	body := strings.TrimPrefix(diff, "--- a/tape.json\n+++ b/tape.json\n")
	if strings.TrimSpace(body) != "" {
		t.Fatalf("expected empty diff body, got:\n%s", diff)
	}
}

// --- encryption transform: fixtures ---

// testVaultItem describes one entry of a test vault: either a directory
// (content empty) or a file (content holds the exact text that must survive
// encryption, decryption and the save backup).
type testVaultItem struct {
	relPath    string // original (normalized) relative path, e.g. "My Folder/note 1.md"
	rawRelPath string // on-disk relative path (may contain encrypted names)
	isDir      bool
	content    string
}

// writeTestVault creates a realistic vault on disk exercising the edge cases
// the encryption transform must handle: notes directly in the vault root, a
// top-level folder with a file directly inside it, nested folder, and names
// containing spaces, hyphens and special characters.
func writeTestVault(t *testing.T) (*App, string, []testVaultItem) {
	t.Helper()

	a := newTestApp("test-password")
	root := t.TempDir()

	items := []testVaultItem{
		{relPath: "my readme §1.md", content: "# my readme\n\nspaces and a special char in the name"},
		{relPath: "my-plain-note.md", content: "# plain\n\njust some text"},
		{relPath: "My Folder", isDir: true},
		{relPath: "My Folder/note 1.md", content: "# note one\n\nfile directly inside a top-level folder"},
		{relPath: "My Folder/deep folder", isDir: true},
		{relPath: "My Folder/deep folder/inner file.md", content: "# inner\n\nnested content with a space in the name"},
	}

	for _, it := range items {
		full := filepath.Join(root, it.relPath)
		if it.isDir {
			if err := os.MkdirAll(full, 0700); err != nil {
				t.Fatalf("create dir %q: %v", it.relPath, err)
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(full), 0700); err != nil {
			t.Fatalf("create parent of %q: %v", it.relPath, err)
		}
		if err := os.WriteFile(full, []byte(it.content), 0600); err != nil {
			t.Fatalf("write file %q: %v", it.relPath, err)
		}
	}

	return a, root, items
}

// findSaveDir returns the path of the save_* backup folder created by the
// transform, failing the test if it is missing or ambiguous.
func findSaveDir(t *testing.T, root string) string {
	t.Helper()

	entries, err := os.ReadDir(root)
	if err != nil {
		t.Fatalf("read vault root: %v", err)
	}

	var saveDirs []string
	for _, e := range entries {
		if e.IsDir() && strings.HasPrefix(e.Name(), "save_") {
			saveDirs = append(saveDirs, filepath.Join(root, e.Name()))
		}
	}

	if len(saveDirs) != 1 {
		t.Fatalf("expected exactly one save_* folder, got %d", len(saveDirs))
	}
	return saveDirs[0]
}

// stripEncPrefix recovers the original name from a deterministic test-encrypted
// name of the form "<index><XXX|YYY>-<originalName>" produced by
// transformTreeIntoMDE1Test.
func stripEncPrefix(encName string) string {
	idx := strings.Index(encName, "-")
	if idx == -1 {
		return encName
	}
	return encName[idx+1:]
}

// collectEncryptedTree walks an encrypted vault (excluding the save_* backup
// and tape.json) and returns every entry with its normalized relative path
// (encrypted name components restored to the original names) and, for files,
// the raw encrypted bytes read from disk.
func collectEncryptedTree(t *testing.T, root, saveDir string) []testVaultItem {
	t.Helper()

	var items []testVaultItem
	err := filepath.Walk(root, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if p == root || info.Name() == "tape.json" {
			return nil
		}

		rel, err := filepath.Rel(root, p)
		if err != nil {
			return err
		}
		if strings.HasPrefix(rel, "save_") {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		parts := strings.Split(rel, string(filepath.Separator))
		norm := make([]string, len(parts))
		for i, part := range parts {
			norm[i] = stripEncPrefix(part)
		}

		item := testVaultItem{
			relPath:    filepath.Join(norm...),
			rawRelPath: rel,
			isDir:      info.IsDir(),
		}
		if !info.IsDir() {
			raw, err := os.ReadFile(p)
			if err != nil {
				return err
			}
			item.content = string(raw)
		}
		items = append(items, item)
		return nil
	})
	if err != nil {
		t.Fatalf("walk encrypted vault: %v", err)
	}
	return items
}

// entryPaths returns the set of relative paths of the given entries, filtered
// to files (wantDir=false) or directories (wantDir=true) only.
func entryPaths(items []testVaultItem, wantDir bool) map[string]bool {
	set := make(map[string]bool)
	for _, it := range items {
		if it.isDir == wantDir {
			set[it.relPath] = true
		}
	}
	return set
}

// verifyEncryptedVault runs the integrity checks over an encrypted vault and
// returns a human-readable list of problems. An empty result means the encrypted
// vault is a faithful, lossless copy of the original. The checks cover:
//   - all files and folders are encrypted (no missing, no extra entries);
//   - the tree layout is respected (every entry lands in the same relative place);
//   - the save_* backup folder is a good, exact copy of the original;
//   - every file content (encrypted copy and backup) is byte-for-byte identical.
//
// The positive tests expect zero problems; the detection test expects the
// verifier to flag a deliberately dropped file.
func verifyEncryptedVault(t *testing.T, root string, original []testVaultItem) []string {
	t.Helper()

	var problems []string

	saveDir := findSaveDir(t, root)
	encrypted := collectEncryptedTree(t, root, saveDir)

	gotFiles := entryPaths(encrypted, false)
	gotDirs := entryPaths(encrypted, true)
	wantFiles := entryPaths(original, false)
	wantDirs := entryPaths(original, true)

	// every original entry must have exactly one encrypted counterpart
	for rel := range wantFiles {
		if !gotFiles[rel] {
			problems = append(problems, fmt.Sprintf("encrypted vault is missing file %q", rel))
		}
	}
	for rel := range wantDirs {
		if !gotDirs[rel] {
			problems = append(problems, fmt.Sprintf("encrypted vault is missing folder %q", rel))
		}
	}
	// no extra entries in the encrypted vault
	for rel := range gotFiles {
		if !wantFiles[rel] {
			problems = append(problems, fmt.Sprintf("encrypted vault has unexpected file %q", rel))
		}
	}
	for rel := range gotDirs {
		if !wantDirs[rel] {
			problems = append(problems, fmt.Sprintf("encrypted vault has unexpected folder %q", rel))
		}
	}

	// every encrypted copy must keep the original content byte for byte
	for _, enc := range encrypted {
		if enc.isDir {
			continue
		}
		want, ok := contentOf(original, enc.relPath)
		if !ok {
			continue
		}
		if enc.content != want {
			problems = append(problems, fmt.Sprintf("content of encrypted copy %q differs:\n got  %q\n want %q", enc.relPath, enc.content, want))
		}
	}

	// the save_* backup must be a faithful copy of the original
	var backup []testVaultItem
	err := filepath.Walk(saveDir, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(saveDir, p)
		if err != nil {
			return err
		}
		if rel == "." {
			return nil
		}
		item := testVaultItem{relPath: rel, rawRelPath: rel, isDir: info.IsDir()}
		if !info.IsDir() {
			raw, err := os.ReadFile(p)
			if err != nil {
				return err
			}
			item.content = string(raw)
		}
		backup = append(backup, item)
		return nil
	})
	if err != nil {
		problems = append(problems, fmt.Sprintf("cannot walk save folder %q: %v", saveDir, err))
		return problems
	}

	backupFiles := entryPaths(backup, false)
	backupDirs := entryPaths(backup, true)
	for rel := range wantFiles {
		if !backupFiles[rel] {
			problems = append(problems, fmt.Sprintf("save folder is missing original file %q", rel))
		}
	}
	for rel := range wantDirs {
		if !backupDirs[rel] {
			problems = append(problems, fmt.Sprintf("save folder is missing original folder %q", rel))
		}
	}
	for _, bk := range backup {
		if bk.isDir {
			continue
		}
		want, ok := contentOf(original, bk.relPath)
		if !ok {
			continue
		}
		if bk.content != want {
			problems = append(problems, fmt.Sprintf("save folder content of %q differs:\n got  %q\n want %q", bk.relPath, bk.content, want))
		}
	}

	return problems
}

// reportProblems fails the test when the given integrity problems are non-empty.
func reportProblems(t *testing.T, problems []string) {
	t.Helper()
	if len(problems) > 0 {
		t.Fatalf("encrypted vault is invalid:\n- %s", strings.Join(problems, "\n- "))
	}
}

// TestEncryptVault_AllFilesAndFoldersEncrypted is the positive coverage test:
// it ensures the transform turns every original file AND folder into exactly
// one encrypted copy, including items sitting directly in the vault root (the
// historical regression that silently lost root-level notes) and names with
// spaces, hyphens and special characters.
func TestEncryptVault_AllFilesAndFoldersEncrypted(t *testing.T) {
	a, root, original := writeTestVault(t)

	if err := a.transformTreeIntoMDE1Test("test-password", root); err != nil {
		t.Fatalf("transform returned an error: %v", err)
	}

	reportProblems(t, verifyEncryptedVault(t, root, original))
}

// TestEncryptVault_TreeStructurePreserved verifies the encrypted vault keeps
// the exact same layout as the original: every folder and every file lands in
// the same relative place (parent/child relationship unchanged), with no extra
// and no missing entries.
func TestEncryptVault_TreeStructurePreserved(t *testing.T) {
	a, root, original := writeTestVault(t)

	if err := a.transformTreeIntoMDE1Test("test-password", root); err != nil {
		t.Fatalf("transform returned an error: %v", err)
	}

	reportProblems(t, verifyEncryptedVault(t, root, original))
}

// TestEncryptVault_SaveFolderIsFaithfulCopy verifies the save_* backup folder
// is a good, lossless copy of the original vault: it contains every folder and
// every file in the same relative layout, and every file's content is byte for
// byte identical to the original content.
func TestEncryptVault_SaveFolderIsFaithfulCopy(t *testing.T) {
	a, root, original := writeTestVault(t)

	if err := a.transformTreeIntoMDE1Test("test-password", root); err != nil {
		t.Fatalf("transform returned an error: %v", err)
	}

	reportProblems(t, verifyEncryptedVault(t, root, original))
}

// TestEncryptVault_ContentExactAndNoDataLoss is the negative/data-integrity
// test: it reads back every copied file and checks its content is byte for
// byte identical to the original content, and that no note is left out of the
// encrypted vault (the regression that skipped top-level items).
func TestEncryptVault_ContentExactAndNoDataLoss(t *testing.T) {
	a, root, original := writeTestVault(t)

	if err := a.transformTreeIntoMDE1Test("test-password", root); err != nil {
		t.Fatalf("transform returned an error: %v", err)
	}

	reportProblems(t, verifyEncryptedVault(t, root, original))
}

// TestEncryptVault_DetectsDroppedTopLevelFile guards the integrity checks
// themselves: a correct transform must produce a complete vault (no problems),
// and if a top-level note is deliberately dropped afterwards, the verifier
// must flag it. If this test fails, the verification would not notice a real
// dropped top-level note either.
func TestEncryptVault_DetectsDroppedTopLevelFile(t *testing.T) {
	a, root, original := writeTestVault(t)

	if err := a.transformTreeIntoMDE1Test("test-password", root); err != nil {
		t.Fatalf("transform returned an error: %v", err)
	}

	// sanity check: a correct transform yields a complete, lossless vault
	reportProblems(t, verifyEncryptedVault(t, root, original))

	// deliberately drop a top-level note from the encrypted vault
	saveDir := findSaveDir(t, root)
	encrypted := collectEncryptedTree(t, root, saveDir)

	var victim *testVaultItem
	for i := range encrypted {
		if !encrypted[i].isDir && !strings.Contains(encrypted[i].rawRelPath, string(filepath.Separator)) {
			victim = &encrypted[i]
			break
		}
	}
	if victim == nil {
		t.Fatal("fixture should contain at least one top-level encrypted file")
	}
	if err := os.Remove(filepath.Join(root, victim.rawRelPath)); err != nil {
		t.Fatalf("remove dropped top-level note: %v", err)
	}

	// the verifier must now report the missing top-level note
	problems := verifyEncryptedVault(t, root, original)
	for _, p := range problems {
		if strings.Contains(p, victim.relPath) {
			return
		}
	}
	t.Fatalf("expected a problem about dropped top-level note %q, got:\n%s", victim.relPath, strings.Join(problems, "\n"))
}

// contentOf returns the original content for the given relative path.
func contentOf(items []testVaultItem, relPath string) (string, bool) {
	for _, it := range items {
		if it.relPath == relPath && !it.isDir {
			return it.content, true
		}
	}
	return "", false
}
