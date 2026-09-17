package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"media-sequencer/database"
	"media-sequencer/models"
)

// GetWindows returns all configured display windows.
func GetWindows(c *gin.Context) {

	rows, err := database.DB.Query(
		"SELECT id, name FROM windows ORDER BY id",
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch windows",
		})
		return
	}

	defer rows.Close()

	var windows []models.Window

	for rows.Next() {

		var window models.Window

		err := rows.Scan(
			&window.ID,
			&window.Name,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to read window data",
			})
			return
		}

		windows = append(windows, window)
	}

	c.JSON(http.StatusOK, gin.H{
		"windows": windows,
	})
}