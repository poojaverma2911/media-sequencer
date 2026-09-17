import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api";


// =====================================================
// MEDIA WINDOW
// =====================================================

function MediaWindow({
  windowData,
  syncState,
  onCurrentMediaChange,
  refreshKey,
}) {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);


  // ---------------------------------------------------
  // Fetch playlist for this window
  // ---------------------------------------------------

  const fetchPlaylist = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/windows/${windowData.id}/playlist`
      );

      const data = await response.json();

      const newPlaylist = data.playlist || [];

      setPlaylist(newPlaylist);

      // Keep current index valid after playlist update
      setCurrentIndex((previousIndex) => {
        if (newPlaylist.length === 0) {
          return 0;
        }

        if (previousIndex >= newPlaylist.length) {
          return 0;
        }

        return previousIndex;
      });

    } catch (error) {
      console.error(
        `Failed to fetch playlist for ${windowData.name}:`,
        error
      );
    } finally {
      setLoading(false);
    }
  }, [windowData.id, windowData.name]);


  // Fetch playlist initially and whenever
  // playlistRefreshKey changes
  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist, refreshKey]);


  // Current media
  const currentMedia = playlist[currentIndex];


  // ---------------------------------------------------
  // Send current media to parent
  // ---------------------------------------------------

  useEffect(() => {
    if (currentMedia) {
      onCurrentMediaChange(
        windowData.id,
        currentMedia
      );
    }
  }, [
    currentMedia,
    windowData.id,
    onCurrentMediaChange,
  ]);


  // ---------------------------------------------------
  // Normal playlist playback
  // ---------------------------------------------------

  useEffect(() => {
    if (!currentMedia || syncState.is_active) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex((previousIndex) => {
        if (playlist.length === 0) {
          return 0;
        }

        // Continuous playlist loop
        return (
          (previousIndex + 1) %
          playlist.length
        );
      });
    }, currentMedia.duration * 1000);

    return () => {
      clearTimeout(timer);
    };

  }, [
    currentMedia,
    playlist.length,
    syncState.is_active,
  ]);


  // ---------------------------------------------------
  // Loading
  // ---------------------------------------------------

  if (loading) {
    return (
      <div className="media-area">
        <div className="placeholder">
          <p>Loading playlist...</p>
        </div>
      </div>
    );
  }


  // ---------------------------------------------------
  // No playlist
  // ---------------------------------------------------

  if (playlist.length === 0) {
    return (
      <div className="media-area">
        <div className="placeholder">
          <span>◼</span>
          <p>No media configured</p>
        </div>
      </div>
    );
  }


  // ===================================================
  // SYNC MODE
  // ===================================================

  if (
    syncState.is_active &&
    syncState.media
  ) {
    const syncMedia = syncState.media;

    let elapsedSeconds = 0;

    if (syncState.started_at) {
      const startTime = new Date(
        syncState.started_at
      ).getTime();

      elapsedSeconds = Math.max(
        0,
        (Date.now() - startTime) / 1000
      );
    }


    return (
      <div className="media-area sync-mode">

        {/* Sync Image */}
        {syncMedia.type === "image" && (
          <img
            src={syncMedia.url}
            alt={syncMedia.name}
            className="media-content"
          />
        )}


        {/* Sync Video */}
        {syncMedia.type === "video" && (
          <SyncVideo
            media={syncMedia}
            elapsedSeconds={elapsedSeconds}
          />
        )}


        {/* Sync Blank */}
        {syncMedia.type === "blank" && (
          <div className="blank-media">
            <p>Blank</p>
          </div>
        )}


        {/* Sync Badge */}
        <div className="sync-badge">
          SYNC: {syncMedia.name}
        </div>

      </div>
    );
  }


  // ===================================================
  // NORMAL MODE
  // ===================================================

  return (
    <div className="media-area">

      {/* Image */}
      {currentMedia.type === "image" && (
        <img
          src={currentMedia.url}
          alt={currentMedia.name}
          className="media-content"
        />
      )}


      {/* Video */}
      {currentMedia.type === "video" && (
        <video
          key={currentMedia.media_id}
          src={currentMedia.url}
          className="media-content"
          autoPlay
          muted
          playsInline
          loop
        />
      )}


      {/* Blank */}
      {currentMedia.type === "blank" && (
        <div className="blank-media">
          <p>Blank</p>
        </div>
      )}


      {/* Media information */}
      <div className="media-info">
        <strong>
          {currentMedia.name}
        </strong>

        <span>
          {currentMedia.duration}s
        </span>
      </div>

    </div>
  );
}


// =====================================================
// SYNC VIDEO
// =====================================================

function SyncVideo({
  media,
  elapsedSeconds,
}) {
  return (
    <video
      key={media.media_id}
      src={media.url}
      className="media-content"
      autoPlay
      muted
      playsInline
      loop

      onLoadedMetadata={(event) => {
        const video = event.currentTarget;

        if (media.duration > 0) {
          video.currentTime =
            elapsedSeconds %
            media.duration;
        }

        video.play().catch(() => {
          console.log(
            "Autoplay was blocked by browser."
          );
        });
      }}
    />
  );
}


// =====================================================
// MAIN APP
// =====================================================

function App() {

  // ---------------------------------------------------
  // Windows
  // ---------------------------------------------------

  const [windows, setWindows] =
    useState([]);


  // ---------------------------------------------------
  // All available media
  // ---------------------------------------------------

  const [mediaList, setMediaList] =
    useState([]);


  // ---------------------------------------------------
  // Current media of each window
  // ---------------------------------------------------

  const [
    currentMediaByWindow,
    setCurrentMediaByWindow,
  ] = useState({});


  // ---------------------------------------------------
  // Sync state
  // ---------------------------------------------------

  const [syncState, setSyncState] =
    useState({
      is_active: false,
      media_id: null,
      media: null,
      duration: 0,
      started_at: null,
    });


  // ---------------------------------------------------
  // Loading
  // ---------------------------------------------------

  const [loading, setLoading] =
    useState(true);


  // ---------------------------------------------------
  // Message
  // ---------------------------------------------------

  const [message, setMessage] =
    useState("");


  // ---------------------------------------------------
  // Add Media Modal
  // ---------------------------------------------------

  const [showAddMedia, setShowAddMedia] =
    useState(false);


  const [selectedWindow, setSelectedWindow] =
    useState(null);


  const [selectedMedia, setSelectedMedia] =
    useState("");


  const [addingMedia, setAddingMedia] =
    useState(false);


  // ---------------------------------------------------
  // Playlist refresh
  // ---------------------------------------------------

  const [
    playlistRefreshKey,
    setPlaylistRefreshKey,
  ] = useState(0);


  // ===================================================
  // FETCH WINDOWS
  // ===================================================

  const fetchWindows = async () => {
    try {
      const response = await fetch(
        `${API_URL}/windows`
      );

      const data = await response.json();

      setWindows(
        data.windows || []
      );

    } catch (error) {
      console.error(
        "Failed to fetch windows:",
        error
      );

    } finally {
      setLoading(false);
    }
  };


  // ===================================================
  // FETCH MEDIA
  // ===================================================

  const fetchMedia = async () => {
    try {
      const response = await fetch(
        `${API_URL}/media`
      );

      const data = await response.json();

      setMediaList(
        data.media || []
      );

    } catch (error) {
      console.error(
        "Failed to fetch media:",
        error
      );
    }
  };


  // ===================================================
  // FETCH SYNC STATUS
  // ===================================================

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch(
        `${API_URL}/sync`
      );

      const data = await response.json();

      setSyncState(data);

    } catch (error) {
      console.error(
        "Failed to fetch sync status:",
        error
      );
    }
  };


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchWindows();
    fetchMedia();
  }, []);


  // ===================================================
  // SYNC POLLING
  // ===================================================

  useEffect(() => {

    if (windows.length === 0) {
      return;
    }

    fetchSyncStatus();

    const interval = setInterval(() => {
      fetchSyncStatus();
    }, 500);

    return () => {
      clearInterval(interval);
    };

  }, [windows.length]);


  // ===================================================
  // CURRENT MEDIA CHANGE
  // ===================================================

  const handleCurrentMediaChange =
    useCallback(
      (windowId, media) => {

        setCurrentMediaByWindow(
          (previous) => ({
            ...previous,
            [windowId]: media,
          })
        );

      },
      []
    );


  // ===================================================
  // START SYNC
  // ===================================================

  const startSync = async (media) => {

    if (!media) {
      return;
    }

    try {

      const response = await fetch(
        `${API_URL}/sync`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            media_id:
              media.media_id,

            duration: 30,
          }),
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        setMessage(
          data.error ||
            "Failed to start synchronization"
        );

        return;
      }


      setSyncState(data);


      setMessage(
        `${media.name} synchronized across all windows for 30 seconds`
      );


      setTimeout(() => {
        setMessage("");
      }, 3000);


    } catch (error) {

      console.error(
        "Synchronization error:",
        error
      );


      setMessage(
        "Failed to connect to backend"
      );
    }
  };


  // ===================================================
  // OPEN ADD MEDIA MODAL
  // ===================================================

  const openAddMedia = (
    windowData
  ) => {

    setSelectedWindow(
      windowData
    );

    setSelectedMedia("");

    setShowAddMedia(true);
  };


  // ===================================================
  // CLOSE ADD MEDIA MODAL
  // ===================================================

  const closeAddMedia = () => {

    setShowAddMedia(false);

    setSelectedWindow(null);

    setSelectedMedia("");
  };


  // ===================================================
  // ADD MEDIA TO WINDOW
  // ===================================================

  const addMediaToWindow =
    async () => {

      if (
        !selectedWindow ||
        !selectedMedia
      ) {

        setMessage(
          "Please select a media item."
        );

        return;
      }


      setAddingMedia(true);


      try {

        const response =
          await fetch(
            `${API_URL}/windows/${selectedWindow.id}/media`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                media_id:
                  Number(selectedMedia),
              }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          setMessage(
            data.error ||
              "Failed to add media"
          );

          return;
        }


        setMessage(
          `${data.media?.name || "Media"} added to ${selectedWindow.name}`
        );


        // Refresh playlists
        setPlaylistRefreshKey(
          (previous) =>
            previous + 1
        );


        closeAddMedia();


        setTimeout(() => {
          setMessage("");
        }, 3000);


      } catch (error) {

        console.error(
          "Add media error:",
          error
        );


        setMessage(
          "Failed to connect to backend"
        );

      } finally {

        setAddingMedia(false);
      }
    };


  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (loading) {
    return (
      <div className="loading">
        Loading windows...
      </div>
    );
  }


  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <div className="app">


      {/* =============================================
          HEADER
      ============================================== */}

      <header className="header">

        <h1>
          Multi-Window Media Sequencer
        </h1>


        <p>
          Media playback and synchronization system
        </p>


        {/* Sync status */}
        {syncState.is_active &&
          syncState.media && (

            <div className="global-sync-status">

              🔴 SYNC ACTIVE —{" "}

              {syncState.media.name}

            </div>
          )}


        {/* Message */}
        {message && (

          <div className="message">
            {message}
          </div>

        )}

      </header>


      {/* =============================================
          WINDOWS GRID
      ============================================== */}

      <main className="window-grid">

        {windows.map(
          (windowData) => {

            const currentMedia =
              currentMediaByWindow[
                windowData.id
              ];


            return (

              <div
                className="media-window"
                key={windowData.id}
              >


                {/* Window Header */}
                <div className="window-header">

                  <h2>
                    {windowData.name}
                  </h2>


                  <span>
                    Window{" "}
                    {windowData.id}
                  </span>

                </div>


                {/* Media Window */}
                <MediaWindow
                  windowData={
                    windowData
                  }

                  syncState={
                    syncState
                  }

                  onCurrentMediaChange={
                    handleCurrentMediaChange
                  }

                  refreshKey={
                    playlistRefreshKey
                  }
                />


                {/* Controls */}
                <div className="window-controls">


                  {/* Add Media */}
                  <button
                    className="add-button"
                    onClick={() =>
                      openAddMedia(
                        windowData
                      )
                    }
                  >
                    + Add Media
                  </button>


                  {/* Sync Current */}
                  <button
                    className="sync-button"

                    disabled={
                      !currentMedia ||
                      syncState.is_active
                    }

                    onClick={() =>
                      startSync(
                        currentMedia
                      )
                    }
                  >
                    Sync Current
                  </button>

                </div>

              </div>
            );
          }
        )}

      </main>


      {/* =============================================
          ADD MEDIA MODAL
      ============================================== */}

      {showAddMedia && (

        <div className="modal-overlay">


          <div className="modal">


            {/* Modal Header */}
            <div className="modal-header">

              <h2>
                Add Media
              </h2>


              <button
                className="close-button"
                onClick={
                  closeAddMedia
                }
              >
                ×
              </button>

            </div>


            {/* Window information */}
            <p className="modal-description">

              Add media to{" "}

              <strong>
                {selectedWindow?.name}
              </strong>

            </p>


            {/* Select label */}
            <label>
              Select Media
            </label>


            {/* Media dropdown */}
            <select
              value={selectedMedia}

              onChange={(event) =>
                setSelectedMedia(
                  event.target.value
                )
              }
            >

              <option value="">
                -- Select Media --
              </option>


              {mediaList.map(
                (media) => (

                  <option
                    key={media.id}
                    value={media.id}
                  >

                    {media.name}
                    {" — "}
                    {media.type}
                    {" — "}
                    {media.duration}s

                  </option>

                )
              )}

            </select>


            {/* Selected media information */}
            {selectedMedia && (

              <div className="selected-media-info">

                {(() => {

                  const media =
                    mediaList.find(
                      (item) =>
                        item.id ===
                        Number(
                          selectedMedia
                        )
                    );


                  if (!media) {
                    return null;
                  }


                  return (

                    <>

                      <strong>
                        {media.name}
                      </strong>


                      <span>
                        Type:{" "}
                        {media.type}
                      </span>


                      <span>
                        Duration:{" "}
                        {media.duration}s
                      </span>

                    </>

                  );

                })()}

              </div>

            )}


            {/* Modal buttons */}
            <div className="modal-actions">


              {/* Cancel */}
              <button
                className="cancel-button"

                onClick={
                  closeAddMedia
                }

                disabled={
                  addingMedia
                }
              >
                Cancel
              </button>


              {/* Add */}
              <button
                className="confirm-button"

                onClick={
                  addMediaToWindow
                }

                disabled={
                  !selectedMedia ||
                  addingMedia
                }
              >

                {addingMedia
                  ? "Adding..."
                  : "Add Media"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default App;