package utilities

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// ZipUtility provides thread-safe helpers for compressing directories into ZIP archives.
type ZipUtility struct{}

var (
	zipUtilityInstance *ZipUtility
	zipUtilityOnce     sync.Once
)

// CurrentZipUtility returns the thread-safe lazy singleton ZipUtility.
func CurrentZipUtility() *ZipUtility {
	zipUtilityOnce.Do(func() {
		zipUtilityInstance = &ZipUtility{}
	})
	return zipUtilityInstance
}

// CompressDirectory walks sourceDir and writes a standard ZIP archive to targetWriter.
func (u *ZipUtility) CompressDirectory(sourceDir string, targetWriter io.Writer) error {
	zipWriter := zip.NewWriter(targetWriter)
	defer zipWriter.Close()

	cleanSource := filepath.Clean(sourceDir)

	err := filepath.Walk(cleanSource, func(filePath string, fileInfo os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		// Calculate relative path for the zip header
		relPath, err := filepath.Rel(cleanSource, filePath)
		if err != nil {
			return fmt.Errorf("failed to calculate relative path: %w", err)
		}

		if relPath == "." {
			return nil
		}

		// Normalize to forward slashes for cross-platform zip archive compatibility
		zipEntryName := strings.ReplaceAll(relPath, "\\", "/")

		if fileInfo.IsDir() {
			zipEntryName += "/"
			_, err := zipWriter.Create(zipEntryName)
			return err
		}

		header, err := zip.FileInfoHeader(fileInfo)
		if err != nil {
			return fmt.Errorf("failed to create zip header for %s: %w", filePath, err)
		}

		header.Name = zipEntryName
		header.Method = zip.Deflate

		writer, err := zipWriter.CreateHeader(header)
		if err != nil {
			return fmt.Errorf("failed to create entry header: %w", err)
		}

		sourceFile, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("failed to open source file %s: %w", filePath, err)
		}
		defer sourceFile.Close()

		_, err = io.Copy(writer, sourceFile)
		return err
	})

	if err != nil {
		return fmt.Errorf("failed to compress directory %s: %w", sourceDir, err)
	}

	return nil
}
