let ytApiLoading = false;
let ytApiAvailable = false;
let historySongId = null;

localAudio.addEventListener('loadedmetadata', function () {
  updatePlayerProgress(localAudio.currentTime, localAudio.duration);
});
localAudio.addEventListener('timeupdate', function () {
  updatePlayerProgress(localAudio.currentTime, localAudio.duration);
});
localAudio.addEventListener('play', function () {
  setPlaybackState(true);
  recordSongHistory();
});
localAudio.addEventListener('pause', function () {
  setPlaybackState(false);
});
localAudio.addEventListener('ended', playNextSong);
localAudio.addEventListener('error', function () {
  if (playingSong && playingSong.audio_path) {
    const mediaError = localAudio.error;
    const messages = {
      1: 'Audio playback was interrupted.',
      2: 'The audio file could not be loaded. Check that the upload still exists on the server.',
      3: 'The audio file could not be decoded. It may be damaged.',
      4: 'This audio format is unsupported or the uploaded file is missing.'
    };
    showMessage(messages[mediaError && mediaError.code] || 'The uploaded audio file could not be played.', true);
    setPlaybackState(false);
  }
});

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) {
    ytApiAvailable = true;
    startPendingYouTubePlayback();
    return;
  }
  if (ytApiLoading || ytApiFailed) {
    return;
  }

  ytApiLoading = true;
  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  script.onerror = function () {
    ytApiLoading = false;
    ytApiFailed = true;
    pendingYouTubeSongId = null;
    showMessage('The YouTube player could not be loaded. Check your internet connection.', true);
  };
  document.head.appendChild(script);
}

function onYouTubeIframeAPIReady() {
  ytApiAvailable = true;
  ytApiLoading = false;
  ytApiFailed = false;
  startPendingYouTubePlayback();
}

function startPendingYouTubePlayback() {
  if (!ytApiAvailable || !pendingYouTubeSongId) {
    return;
  }
  const videoId = pendingYouTubeSongId;
  pendingYouTubeSongId = null;
  playYouTubeVideo(videoId);
}

async function playSong(songId) {
  const requestId = ++playbackRequest;
  let song = songCache[songId];
  if (!song) {
    try {
      song = await request('GET', '/songs/' + songId);
    } catch (err) {
      showMessage(err.message, true);
      return;
    }
    if (requestId !== playbackRequest) {
      return;
    }
    cacheSongs([song]);
  }

  if (!song.youtube_id && !song.audio_path) {
    showMessage('This song has no playable audio source.', true);
    return;
  }

  playingSong = song;
  historySongId = null;
  $('playerTitle').textContent = song.song_title || song.title || 'Unknown song';
  $('playerArtist').textContent = song.artist_name || 'Unknown artist';
  $('playerTime').textContent = formatTime(Number(song.duration) || 0);
  $('playerElapsed').textContent = '0:00';
  $('playerSeek').value = '0';

  localAudio.pause();
  localAudio.removeAttribute('src');
  localAudio.load();
  $('yt-player-container').classList.add('hidden');

  if (song.youtube_id) {
    pendingYouTubeSongId = String(song.youtube_id);
    loadYouTubeAPI();
    return;
  }

  if (ytPlayer && ytPlayerReady) {
    ytPlayer.stopVideo();
  }
  localAudio.src = song.audio_path;
  localAudio.volume = Number($('playerVolume').value) / 100;
  try {
    await localAudio.play();
  } catch (err) {
    if (requestId === playbackRequest) {
      const message = err && err.name === 'NotAllowedError'
        ? 'The browser blocked playback. Press Play again.'
        : 'Playback could not start: ' + (err && err.message ? err.message : 'unknown audio error');
      showMessage(message, true);
      setPlaybackState(false);
    }
  }
}

function playYouTubeVideo(videoId) {
  if (!videoId || !window.YT || !window.YT.Player || !playingSong) {
    return;
  }
  $('yt-player-container').classList.remove('hidden');
  if (ytPlayer && ytPlayerReady) {
    ytPlayer.loadVideoById(videoId);
    ytPlayer.setVolume(Number($('playerVolume').value));
    return;
  }
  if (ytPlayer) {
    pendingYouTubeSongId = videoId;
    return;
  }

  ytPlayerReady = false;
  ytPlayer = new window.YT.Player('yt-player-container', {
    width: '240',
    height: '135',
    videoId: videoId,
    playerVars: { playsinline: 1 },
    events: {
      onReady: function (event) {
        ytPlayerReady = true;
        event.target.setVolume(Number($('playerVolume').value));
        if (pendingYouTubeSongId) {
          const nextVideoId = pendingYouTubeSongId;
          pendingYouTubeSongId = null;
          event.target.loadVideoById(nextVideoId);
        }
      },
      onStateChange: function (event) {
        if (!window.YT || !window.YT.PlayerState) {
          return;
        }
        if (event.data === window.YT.PlayerState.PLAYING) {
          setPlaybackState(true);
          recordSongHistory();
          updatePlayerProgress(event.target.getCurrentTime(), event.target.getDuration());
        } else if (event.data === window.YT.PlayerState.PAUSED ||
          event.data === window.YT.PlayerState.ENDED) {
          setPlaybackState(false);
          if (event.data === window.YT.PlayerState.ENDED) {
            playNextSong();
          }
        }
      },
      onError: function () {
        setPlaybackState(false);
        showMessage('This YouTube video could not be played.', true);
      }
    }
  });
}

function setPlaybackState(playing) {
  isPlaying = playing;
  const button = $('playPauseButton');
  button.textContent = playing ? 'Ⅱ' : '▶';
  button.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  button.title = playing ? 'Pause' : 'Play';
}

async function recordSongHistory() {
  if (!playingSong || historySongId === playingSong.song_id) {
    return;
  }
  historySongId = playingSong.song_id;
  try {
    await request('POST', '/history', { song_id: playingSong.song_id });
  } catch (err) {
    historySongId = null;
    showMessage('Could not save listening history: ' + err.message, true);
  }
}

function updatePlayerProgress(currentTime, duration) {
  const elapsed = Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0;
  const total = Number.isFinite(duration) && duration > 0 ? duration : Number(playingSong && playingSong.duration) || 0;
  $('playerElapsed').textContent = formatTime(Math.floor(elapsed));
  if (total > 0) {
    $('playerTime').textContent = formatTime(Math.floor(total));
    $('playerSeek').value = String(Math.round(Math.min(elapsed / total, 1) * 1000));
  }
}

function togglePlayback() {
  if (!playingSong) {
    if (playbackList.length > 0) {
      playSong(playbackList[0].song_id);
    }
    return;
  }
  if (playingSong.youtube_id) {
    if (!ytPlayer || !ytPlayerReady) {
      pendingYouTubeSongId = String(playingSong.youtube_id);
      loadYouTubeAPI();
      return;
    }
    if (isPlaying) {
      ytPlayer.pauseVideo();
    } else {
      ytPlayer.playVideo();
    }
  } else if (localAudio.paused) {
    localAudio.play().catch(function () {
      showMessage('Playback could not start. Try pressing Play again.', true);
    });
  } else {
    localAudio.pause();
  }
}

function seekSong(value) {
  const fraction = Math.max(0, Math.min(Number(value) / 1000, 1));
  if (playingSong && playingSong.youtube_id && ytPlayer && ytPlayerReady) {
    const duration = ytPlayer.getDuration();
    if (duration > 0) {
      ytPlayer.seekTo(duration * fraction, true);
    }
  } else if (Number.isFinite(localAudio.duration) && localAudio.duration > 0) {
    localAudio.currentTime = localAudio.duration * fraction;
  }
}

function setPlayerVolume(value) {
  const volume = Math.max(0, Math.min(Number(value), 100));
  localAudio.volume = volume / 100;
  if (ytPlayer && ytPlayerReady) {
    ytPlayer.setVolume(volume);
  }
}

function stopSong() {
  playbackRequest++;
  pendingYouTubeSongId = null;
  localAudio.pause();
  localAudio.removeAttribute('src');
  localAudio.load();
  if (ytPlayer && ytPlayerReady) {
    ytPlayer.stopVideo();
  }
  playingSong = null;
  historySongId = null;
  $('playerTitle').textContent = 'Nothing playing';
  $('playerArtist').textContent = 'Choose a song to get started';
  $('playerElapsed').textContent = '0:00';
  $('playerTime').textContent = '0:00';
  $('playerSeek').value = '0';
  $('yt-player-container').classList.add('hidden');
  setPlaybackState(false);
}

function playPreviousSong() {
  if (!playingSong) {
    return;
  }
  if (playingSong.youtube_id) {
    if (ytPlayer && ytPlayerReady) {
      ytPlayer.seekTo(0, true);
    }
    return;
  }
  if (playbackList.length < 2) {
    if (localAudio.currentTime > 3) {
      localAudio.currentTime = 0;
    }
    return;
  }
  const index = playbackList.findIndex(function (song) {
    return song.song_id === playingSong.song_id;
  });
  if (index > 0) {
    playSong(playbackList[index - 1].song_id);
  } else {
    localAudio.currentTime = 0;
  }
}

function playNextSong() {
  if (!playingSong || playbackList.length < 2) {
    stopSong();
    return;
  }
  const index = playbackList.findIndex(function (song) {
    return song.song_id === playingSong.song_id;
  });
  if (index >= 0 && index < playbackList.length - 1) {
    playSong(playbackList[index + 1].song_id);
  } else {
    stopSong();
  }
}

function startGenreHopMix() {
  if (playbackList.length === 0) {
    showMessage('There are no songs available for a genre-hop mix.', true);
    return;
  }
  const songs = playbackList.slice();
  for (let i = songs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [songs[i], songs[j]] = [songs[j], songs[i]];
  }
  playbackList = songs;
  playSong(songs[0].song_id);
}

setPlaybackState(false);
$('yt-player-container').classList.add('hidden');
