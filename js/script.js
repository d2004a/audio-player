console.log("Lets write JavaScript");
let currentSong = new Audio();
let songs = [];
let currFolder = "";
let currentSongIndex = 0;
let loop = false;
let shuffle = false;

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

async function getSongs(folder) {
  currFolder = folder;
  let a = await fetch(`/${folder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
    }
  }

  let songUL = document.querySelector(".songList ul");
  songUL.innerHTML = "";
  for (const song of songs) {
    songUL.innerHTML += `<li><img class="invert" width="34" src="img/music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Harry</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div> </li>`;
  }

  Array.from(document.querySelector(".songList li")).forEach((e, i) => {
    e.addEventListener("click", () => {
      playMusic(songs[i]);
    });
  });

  return songs;
}

function updateActiveUI() {
  document.querySelectorAll(".songList li").forEach((li, i) => {
    li.classList.remove("active");
    if (i === currentSongIndex) {
      li.classList.add("active");
    }
  });
}

const playMusic = (track, pause = false) => {
  currentSongIndex = songs.indexOf(track);
  currentSong.src = `/${currFolder}/${encodeURIComponent(track)}`;
  if (!pause) {
    currentSong.play().catch((err) => console.error("Playback failed", err));
    play.src = "img/pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
  updateActiveUI();
};

async function displayAlbums() {
  console.log("displaying albums");
  let a = await fetch(`/songs/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");

  for (let e of anchors) {
    let href = new URL(e.href).pathname;
    if (
      href.includes("/songs/") &&
      !href.endsWith(".mp3") &&
      !href.includes(".htaccess")
    ) {
      let folder = href.split("/songs/")[1].split("/")[0];
      try {
        let res = await fetch(`/songs/${folder}/info.json`);
        let metadata = await res.json();

        cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${metadata.title}</h2>
                        <p>${metadata.description}</p>
                    </div>`;
      } catch (err) {
        console.warn(`⚠️ Skipping folder '${folder}' due to error:`, err);
      }
    }
  }

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", async () => {
      let folder = card.dataset.folder;
      songs = await getSongs(`songs/${folder}`);
      playMusic(songs[0]);
    });
  });
}

async function main() {
  await getSongs("songs/ncs");
  playMusic(songs[0], true);
  await displayAlbums();

  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "img/play.svg";
    }
  });

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
      currentSong.currentTime
    )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  currentSong.addEventListener("ended", () => {
    if (loop) {
      playMusic(songs[currentSongIndex]);
    } else if (shuffle) {
      let randomIndex = Math.floor(Math.random() * songs.length);
      playMusic(songs[randomIndex]);
    } else if (currentSongIndex + 1 < songs.length) {
      playMusic(songs[currentSongIndex + 1]);
    }
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  previous.addEventListener("click", () => {
    currentSong.pause();
    if (currentSongIndex > 0) {
      playMusic(songs[currentSongIndex - 1]);
    }
  });

  next.addEventListener("click", () => {
    currentSong.pause();
    if (currentSongIndex < songs.length - 1) {
      playMusic(songs[currentSongIndex + 1]);
    }
  });

  document.querySelector(".range input").addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
    if (currentSong.volume > 0) {
      document.querySelector(".volume>img").src = "img/volume.svg";
    }
  });

  document.querySelector(".volume>img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = "img/mute.svg";
      currentSong.volume = 0;
      document.querySelector(".range input").value = 0;
    } else {
      e.target.src = "img/volume.svg";
      currentSong.volume = 0.1;
      document.querySelector(".range input").value = 10;
    }
  });

  // Optional: toggle loop/shuffle mode via keyboard for now
  document.addEventListener("keydown", (e) => {
    if (e.key === "l") {
      loop = !loop;
      shuffle = false;
      alert(`Loop mode: ${loop}`);
    } else if (e.key === "s") {
      shuffle = !shuffle;
      loop = false;
      alert(`Shuffle mode: ${shuffle}`);
    }
  });

  // Loop & Shuffle buttons
  document.getElementById("loopBtn").addEventListener("click", () => {
    loop = !loop;
    shuffle = false;
    alert(`Loop: ${loop}`);
  });

  document.getElementById("shuffleBtn").addEventListener("click", () => {
    shuffle = !shuffle;
    loop = false;
    alert(`Shuffle: ${shuffle}`);
  });
}

main();
