package models

// Window represents one display window.
type Window struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// PlaylistItem represents one media item assigned to a window.
type PlaylistItem struct {
	MediaID  int    `json:"media_id"`
	Name     string `json:"name"`
	Type     string `json:"type"`
	URL      string `json:"url"`
	Duration int    `json:"duration"`
	Position int    `json:"position"`
}
// AddMediaRequest represents a request to add media to a window playlist.
type AddMediaRequest struct {
	MediaID int `json:"media_id"`
}
// SyncRequest represents a request to start synchronized playback.
type SyncRequest struct {
	MediaID  int `json:"media_id"`
	Duration int `json:"duration"`
}