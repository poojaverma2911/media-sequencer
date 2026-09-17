package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"media-sequencer/database"
)

func GetMedia(c *gin.Context) {
	rows, err := database.DB.Query(`
		SELECT id, name, type, url, duration
		FROM media
		ORDER BY id
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch media",
		})
		return
	}
	defer rows.Close()

	var media []gin.H

	for rows.Next() {
		var (
			id       int
			name     string
			mediaType string
			url      string
			duration int
		)

		err := rows.Scan(&id, &name, &mediaType, &url, &duration)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to read media",
			})
			return
		}

		media = append(media, gin.H{
			"id":       id,
			"name":     name,
			"type":     mediaType,
			"url":      url,
			"duration": duration,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"media": media,
	})
}