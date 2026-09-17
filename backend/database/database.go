package database

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

// Connect initializes the connection between the Go backend
// and the MySQL database.
func Connect() {

	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")

	// Local development defaults
	if dbUser == "" {
		dbUser = "media_app"
	}

	if dbPassword == "" {
		dbPassword = "MediaApp@123"
	}

	if dbHost == "" {
		dbHost = "127.0.0.1"
	}

	if dbPort == "" {
		dbPort = "3306"
	}

	if dbName == "" {
		dbName = "media_sequencer"
	}

	dsn := dbUser + ":" + dbPassword + "@tcp(" + dbHost + ":" + dbPort + ")/" + dbName + "?parseTime=true&tls=true"
	var err error

	DB, err = sql.Open("mysql", dsn)

	if err != nil {
		log.Fatal("Failed to open database:", err)
	}

	// Verify that the database is reachable.
	if err := DB.Ping(); err != nil {
		log.Fatal("Failed to connect to MySQL:", err)
	}

	log.Println("MySQL connected successfully!")
}