package main

import (
	"context"
	"path/filepath"
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
