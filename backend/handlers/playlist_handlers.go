package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"media-sequencer/database"
	"media-sequencer/models"
)

// GetPlaylist returns the media playlist configured for a window.
func GetPlaylist(c *gin.Context) {

	windowID, err := strconv.Atoi(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid window ID",
		})
		return
	}

	query := `
		SELECT 
			m.id,
			m.name,
			m.type,
			m.url,
			m.duration,
			p.position
		FROM playlists p
		JOIN media m ON p.media_id = m.id
		WHERE p.window_id = ?
		ORDER BY p.position
	`

	rows, err := database.DB.Query(query, windowID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch playlist",
		})
		return
	}

	defer rows.Close()

	playlist := []models.PlaylistItem{}

	for rows.Next() {

		var item models.PlaylistItem

		err := rows.Scan(
			&item.MediaID,
			&item.Name,
			&item.Type,
			&item.URL,
			&item.Duration,
			&item.Position,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to read playlist data",
			})
			return
		}

		playlist = append(playlist, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"window_id": windowID,
		"playlist":  playlist,
	})
}
// AddMediaToPlaylist adds a media item to the end of a window's playlist.
func AddMediaToPlaylist(c *gin.Context) {

	windowID, err := strconv.Atoi(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid window ID",
		})
		return
	}

	var request models.AddMediaRequest

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

	// Check whether the media exists.
	var mediaExists int

	err = database.DB.QueryRow(
		"SELECT COUNT(*) FROM media WHERE id = ?",
		request.MediaID,
	).Scan(&mediaExists)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check media",
		})
		return
	}

	if mediaExists == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Media not found",
		})
		return
	}

	// Find the next playlist position.
	var nextPosition int

	err = database.DB.QueryRow(
		"SELECT COALESCE(MAX(position), 0) + 1 FROM playlists WHERE window_id = ?",
		windowID,
	).Scan(&nextPosition)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to determine playlist position",
		})
		return
	}

	// Add the media to the playlist.
	_, err = database.DB.Exec(
		"INSERT INTO playlists (window_id, media_id, position) VALUES (?, ?, ?)",
		windowID,
		request.MediaID,
		nextPosition,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to add media to playlist",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Media added to playlist successfully",
		"window_id":  windowID,
		"media_id":   request.MediaID,
		"position":   nextPosition,
	})
}