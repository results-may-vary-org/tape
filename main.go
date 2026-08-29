package main

import (
	"context"
	"embed"
	"sync/atomic"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

// hasUnsaved tracks whether the current note has unsaved changes.
// It is kept in sync from the frontend via App.SetUnsaved so that
// OnBeforeClose can decide synchronously (no async round-trip).
var hasUnsaved atomic.Bool

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "tape",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		// allow the close unless there are unsaved changes; in that case
		// cancel and let the frontend warn before quitting
		OnBeforeClose: func(ctx context.Context) bool {
			if !hasUnsaved.Load() {
				return false
			}
			runtime.EventsEmit(ctx, "tape:before-close")
			return true
		},
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
