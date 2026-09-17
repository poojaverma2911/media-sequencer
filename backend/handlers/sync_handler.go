package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"media-sequencer/database"
	"media-sequencer/models"
)

// StartSync starts synchronized playback for all display windows.
func StartSync(c *gin.Context) {

	var request models.SyncRequest

	// Read JSON request body.
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if request.MediaID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "media_id must be greater than 0",
		})
		return
	}

	// Use 30 seconds if duration is not provided.
	if request.Duration <= 0 {
		request.Duration = 30
	}

	// Check that the selected media exists.
	var media models.PlaylistItem

	err := database.DB.QueryRow(`
		SELECT id, name, type, url, duration
		FROM media
		WHERE id = ?
	`, request.MediaID).Scan(
		&media.MediaID,
		&media.Name,
		&media.Type,
		&media.URL,
		&media.Duration,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Media not found",
		})
		return
	}

	// Store the exact UTC time when synchronization starts.
	startedAt := time.Now().UTC()

	_, err = database.DB.Exec(`
		UPDATE sync_state
		SET media_id = ?,
			duration = ?,
			started_at = ?,
			is_active = TRUE
		WHERE id = 1
	`,
		request.MediaID,
		request.Duration,
		startedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to start synchronization",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Synchronization started",
		"media":      media,
		"duration":   request.Duration,
		"started_at": startedAt,
		"is_active":  true,
	})
}

// GetSyncStatus returns the current synchronization state.
func GetSyncStatus(c *gin.Context) {

	var (
		mediaID   *int
		duration  int
		startedAt *time.Time
		isActive  bool
	)

	err := database.DB.QueryRow(`
		SELECT media_id, duration, started_at, is_active
		FROM sync_state
		WHERE id = 1
	`).Scan(
		&mediaID,
		&duration,
		&startedAt,
		&isActive,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch sync status",
		})
		return
	}

	// Automatically expire synchronization after its configured duration.
	if isActive && startedAt != nil {

		elapsed := time.Since(*startedAt)

		if elapsed >= time.Duration(duration)*time.Second {

			_, err := database.DB.Exec(`
				UPDATE sync_state
				SET is_active = FALSE
				WHERE id = 1
			`)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Failed to stop synchronization",
				})
				return
			}

			isActive = false
		}
	}

	// No active sync.
	if !isActive || mediaID == nil {
		c.JSON(http.StatusOK, gin.H{
			"is_active":  false,
			"media":      nil,
			"media_id":   mediaID,
			"duration":   duration,
			"started_at": startedAt,
		})
		return
	}

	// Get complete media information for the frontend.
	var media models.PlaylistItem

	err = database.DB.QueryRow(`
		SELECT id, name, type, url, duration
		FROM media
		WHERE id = ?
	`, *mediaID).Scan(
		&media.MediaID,
		&media.Name,
		&media.Type,
		&media.URL,
		&media.Duration,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch synchronized media",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_active":  true,
		"media_id":   *mediaID,
		"media":      media,
		"duration":   duration,
		"started_at": startedAt,
	})
}