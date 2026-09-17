package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
    "media-sequencer/database"
	"media-sequencer/handlers"
)

func main() {

	// Connect to MySQL database.
	database.Connect()

	// Create the Gin router.
	router := gin.Default()
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
	
		c.Next()
	})

	// Health-check endpoint.
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Media Sequencer Backend is running",
		})
	})
    router.GET("/api/windows", handlers.GetWindows)
	router.GET("/api/media", handlers.GetMedia)
	router.GET("/api/windows/:id/playlist", handlers.GetPlaylist)
	router.POST("/api/windows/:id/media", handlers.AddMediaToPlaylist)
	router.POST("/api/sync", handlers.StartSync)
	router.GET("/api/sync", handlers.GetSyncStatus)

	log.Println("Server running on http://localhost:8080")

	// Start the backend server.
	port := os.Getenv("PORT")
if port == "" {
    port = "8080"
}

router.Run(":" + port)
}
