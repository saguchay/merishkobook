// DOM Elements
const videoContainer = document.getElementById('video-container');
const categoriesContainer = document.getElementById('categories-container');
const mobileCategoriesMenu = document.getElementById('mobile-categories-menu');
const mobileCategoriesBtn = document.getElementById('mobile-categories-btn');
const searchInput = document.getElementById('search-input');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// State
let currentVideoIndex = 0;
let currentCategory = 'All';
let searchQuery = '';
let videos = [];
let autoplayBlocked = false;
let isScrolling = false;
let videoElements = {};
let videoData = null;

// Initialize the app
function initApp() {
    // Fetch video data
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            videoData = data;
            videos = [...videoData.videos];
            renderCategories();
            renderVideos();
            setupEventListeners();
        })
        .catch(error => {
            console.error('Error loading video data:', error);
            // Fallback if data.json fails to load
            videoData = {
                videos: [
                    {
                        "id": "vid-001",
                        "title": "Beautiful Mountain Landscape",
                        "src": "https://assets.codepen.io/3364143/sample.mp4",
                        "category": "Idea"
                    },
                    {
                        "id": "vid-002",
                        "title": "Delicious Cooking Recipe",
                        "src": "https://assets.codepen.io/3364143/sample-2.mp4",
                        "category": "Idea"
                    },
                    {
                        "id": "vid-003",
                        "title": "Epic Skateboard Trick",
                        "src": "https://assets.codepen.io/3364143/sample-3.mp4",
                        "category": "Idea"
                    },
                    {
                        "id": "vid-004",
                        "title": "City Night Timelapse",
                        "src": "https://assets.codepen.io/3364143/sample-4.mp4",
                        "category": "Idea"
                    },
                    {
                        "id": "vid-005",
                        "title": "Morning Coffee Preparation",
                        "src": "https://assets.codepen.io/3364143/sample-5.mp4",
                        "category": "Games"
                    },
                    {
                        "id": "vid-006",
                        "title": "Guitar Performance",
                        "src": "https://assets.codepen.io/3364143/sample-6.mp4",
                        "category": "Games"
                    }
                ],
                categories: ["All", "Rhymes", "Nepali", "English", "Maths", "Social","Science","Idea","Games"]
            };
            videos = [...videoData.videos];
            renderCategories();
            renderVideos();
            setupEventListeners();
        });
}

// Render categories
function renderCategories() {
    // Desktop categories
    categoriesContainer.innerHTML = '';
    videoData.categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = category;
        button.dataset.category = category;
        if (category === currentCategory) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => filterByCategory(category));
        categoriesContainer.appendChild(button);
    });
    
    // Mobile categories
    mobileCategoriesMenu.innerHTML = '';
    videoData.categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = category;
        button.dataset.category = category;
        if (category === currentCategory) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            filterByCategory(category);
            mobileCategoriesMenu.classList.remove('active');
        });
        mobileCategoriesMenu.appendChild(button);
    });
}

// Render videos based on current filter
function renderVideos() {
    videoContainer.innerHTML = '';
    videoElements = {};
    
    if (videos.length === 0) {
        videoContainer.innerHTML = `
            <div class="no-results" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center;">
                <i class="fas fa-video-slash" style="font-size: 60px; margin-bottom: 20px; opacity: 0.7;"></i>
                <h2 style="font-size: 28px; margin-bottom: 15px;">No videos found</h2>
                <p style="font-size: 18px; opacity: 0.8;">Try a different search or category</p>
            </div>
        `;
        return;
    }
    
    videos.forEach((video, index) => {
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.dataset.index = index;
        
        videoItem.innerHTML = `
            <div class="spinner"></div>
            <video class="video-player" id="video-${video.id}" muted playsinline>
                <source src="${video.src}" type="video/mp4">
            </video>
            <div class="video-title">${video.title}</div>
            <div class="video-controls">
                <button class="control-btn play-pause-btn" aria-label="Play/Pause">
                    <i class="fas fa-play"></i>
                </button>
                <div class="progress-container">
                    <div class="progress-bar"></div>
                    <div class="progress-handle"></div>
                </div>
                <button class="control-btn fullscreen-btn" aria-label="Fullscreen">
                    <i class="fas fa-expand"></i>
                </button>
                <button class="control-btn volume-btn" aria-label="Mute/Unmute">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
            <div class="sound-overlay ${autoplayBlocked ? '' : 'hidden'}" id="sound-overlay-${video.id}">
                <i class="fas fa-volume-mute"></i>
                <h2>Sound is Disabled</h2>
                <p>For the best experience, enable sound for this video. Your browser may have blocked autoplay with sound.</p>
                <button class="enable-sound-btn">Enable Sound</button>
            </div>
        `;
        
        videoContainer.appendChild(videoItem);
        
        // Store reference to video element
        const videoElement = videoItem.querySelector(`#video-${video.id}`);
        videoElements[video.id] = {
            element: videoElement,
            index: index,
            spinner: videoItem.querySelector('.spinner')
        };
        
        // Setup video event listeners
        setupVideoListeners(video.id, index);
    });
    
    // Initialize the first video
    setTimeout(() => {
        if (videos.length > 0) {
            const firstVideoId = videos[0].id;
            const firstVideo = videoElements[firstVideoId].element;
            
            if (firstVideo) {
                // Attempt to play with sound
                firstVideo.play().catch(error => {
                    if (error.name === 'NotAllowedError') {
                        const overlay = document.getElementById(`sound-overlay-${firstVideoId}`);
                        if (overlay) {
                            overlay.classList.remove('hidden');
                        }
                        autoplayBlocked = true;
                    }
                });
            }
        }
    }, 500);
    
    // Set current video index to 0 when filtering
    currentVideoIndex = 0;
    scrollToVideo(0);
}

// Setup event listeners for a specific video
function setupVideoListeners(videoId, index) {
    const video = document.getElementById(`video-${videoId}`);
    const videoItem = document.querySelector(`.video-item[data-index="${index}"]`);
    
    if (!video || !videoItem) return;
    
    // Remove spinner when video can play
    video.addEventListener('canplay', () => {
        const spinner = videoItem.querySelector('.spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    });
    
    // Play/Pause button
    const playPauseBtn = videoItem.querySelector('.play-pause-btn');
    const playPauseIcon = playPauseBtn.querySelector('i');
    
    playPauseBtn.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            playPauseIcon.className = 'fas fa-pause';
        } else {
            video.pause();
            playPauseIcon.className = 'fas fa-play';
        }
    });
    
    // Update play/pause icon when video state changes
    video.addEventListener('play', () => {
        playPauseIcon.className = 'fas fa-pause';
    });
    
    video.addEventListener('pause', () => {
        playPauseIcon.className = 'fas fa-play';
    });
    
    // Progress bar
    const progressContainer = videoItem.querySelector('.progress-container');
    const progressBar = videoItem.querySelector('.progress-bar');
    const progressHandle = videoItem.querySelector('.progress-handle');
    
    // Update progress bar as video plays
    video.addEventListener('timeupdate', () => {
        const percent = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${percent}%`;
        progressHandle.style.left = `${percent}%`;
    });
    
    // Seek functionality
    progressContainer.addEventListener('click', (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        video.currentTime = pos * video.duration;
    });
    
    // Fullscreen button
    const fullscreenBtn = videoItem.querySelector('.fullscreen-btn');
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            videoItem.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });
    
    // Volume button (mute/unmute only)
    const volumeBtn = videoItem.querySelector('.volume-btn');
    const volumeIcon = volumeBtn.querySelector('i');
    
    volumeBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        volumeIcon.className = video.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    });
    
    // Enable sound button
    const enableSoundBtn = videoItem.querySelector('.enable-sound-btn');
    if (enableSoundBtn) {
        enableSoundBtn.addEventListener('click', () => {
            video.muted = false;
            video.play();
            const overlay = document.getElementById(`sound-overlay-${videoId}`);
            if (overlay) {
                overlay.classList.add('hidden');
            }
            autoplayBlocked = false;
            
            // Update volume button
            volumeIcon.className = 'fas fa-volume-up';
        });
    }
}

// Filter videos by category
function filterByCategory(category) {
    currentCategory = category;
    searchQuery = '';
    searchInput.value = '';
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    if (category === 'All') {
        videos = [...videoData.videos];
    } else {
        videos = videoData.videos.filter(video => video.category === category);
    }
    
    renderVideos();
}

// Filter videos by search query
function filterBySearch(query) {
    searchQuery = query.toLowerCase();
    currentCategory = 'All';
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === 'All');
    });
    
    if (!query) {
        videos = [...videoData.videos];
    } else {
        videos = videoData.videos.filter(video => 
            video.title.toLowerCase().includes(query) || 
            video.category.toLowerCase().includes(query)
        );
    }
    
    renderVideos();
}

// Scroll to a specific video
function scrollToVideo(index) {
    if (videos.length === 0) return;
    
    if (index < 0) index = 0;
    if (index >= videos.length) index = videos.length - 1;
    
    currentVideoIndex = index;
    const videoItem = document.querySelector(`.video-item[data-index="${index}"]`);
    if (videoItem) {
        isScrolling = true;
        videoItem.scrollIntoView({ behavior: 'smooth' });
        
        // Set timeout to reset scrolling flag
        setTimeout(() => {
            isScrolling = false;
            
            // Play the current video and pause others
            videos.forEach((video, i) => {
                const videoEl = videoElements[video.id].element;
                if (i === index) {
                    videoEl.play().catch(e => {
                        if (e.name === 'NotAllowedError') {
                            const overlay = document.getElementById(`sound-overlay-${video.id}`);
                            if (overlay) {
                                overlay.classList.remove('hidden');
                            }
                        }
                    });
                } else {
                    videoEl.pause();
                }
            });
        }, 500);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', (e) => {
        filterBySearch(e.target.value);
    });
    
    // Mobile categories button
    mobileCategoriesBtn.addEventListener('click', () => {
        mobileCategoriesMenu.classList.toggle('active');
    });
    
    // Navigation buttons
    prevBtn.addEventListener('click', () => {
        scrollToVideo(currentVideoIndex - 1);
    });
    
    nextBtn.addEventListener('click', () => {
        scrollToVideo(currentVideoIndex + 1);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlayPause();
        } else if (e.code === 'ArrowUp') {
            e.preventDefault();
            scrollToVideo(currentVideoIndex - 1);
        } else if (e.code === 'ArrowDown') {
            e.preventDefault();
            scrollToVideo(currentVideoIndex + 1);
        } else if (e.code === 'KeyF') {
            e.preventDefault();
            toggleFullscreen();
        } else if (e.code === 'KeyM') {
            e.preventDefault();
            toggleMute();
        }
    });
    
    // Scroll snapping
    videoContainer.addEventListener('scroll', () => {
        if (isScrolling || videos.length === 0) return;
        
        const videoItems = document.querySelectorAll('.video-item');
        const containerRect = videoContainer.getBoundingClientRect();
        
        videoItems.forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            // Check if the video is at least 50% in view
            if (itemRect.top <= containerRect.height / 2 && 
                itemRect.bottom >= containerRect.height / 2) {
                if (index !== currentVideoIndex) {
                    currentVideoIndex = index;
                    const video = item.querySelector('video');
                    if (video) {
                        video.play().catch(e => {
                            if (e.name === 'NotAllowedError') {
                                const videoId = video.id.split('-')[1];
                                const overlay = document.getElementById(`sound-overlay-${videoId}`);
                                if (overlay) {
                                    overlay.classList.remove('hidden');
                                }
                            }
                        });
                        
                        // Pause other videos
                        videoItems.forEach((vItem, i) => {
                            if (i !== index) {
                                vItem.querySelector('video').pause();
                            }
                        });
                    }
                }
            }
        });
    });
}

// Toggle play/pause for current video
function togglePlayPause() {
    if (videos.length === 0) return;
    
    const currentVideoId = videos[currentVideoIndex].id;
    const video = videoElements[currentVideoId].element;
    
    if (video) {
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }
}

// Toggle fullscreen
function toggleFullscreen() {
    if (videos.length === 0) return;
    
    const videoItem = document.querySelector(`.video-item[data-index="${currentVideoIndex}"]`);
    if (videoItem) {
        if (!document.fullscreenElement) {
            videoItem.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
}

// Toggle mute
function toggleMute() {
    if (videos.length === 0) return;
    
    const currentVideoId = videos[currentVideoIndex].id;
    const video = videoElements[currentVideoId].element;
    
    if (video) {
        video.muted = !video.muted;
        
        // Update volume button icon
        const videoItem = document.querySelector(`.video-item[data-index="${currentVideoIndex}"]`);
        if (videoItem) {
            const volumeIcon = videoItem.querySelector('.volume-btn i');
            if (volumeIcon) {
                volumeIcon.className = video.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);