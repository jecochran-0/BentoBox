// Global variables
const uploadArea = document.getElementById("upload-area");
const fileInput = document.getElementById("file-input");
const thumbnailsContainer = document.getElementById("thumbnails");
const generateBtn = document.getElementById("generate-btn");
const loadingSection = document.getElementById("loading");
const gridsSection = document.getElementById("grids-section");
const uploadSection = document.getElementById("upload-section");
const minimalistGrid = document.getElementById("minimalist-grid");
const playfulGrid = document.getElementById("playful-grid");
const balancedGrid = document.getElementById("balanced-grid");

// Initialize preview modal elements
const modal = document.getElementById("code-preview-modal");
const previewTitle = document.getElementById("preview-title");
const codePreview = document.getElementById("code-preview");
const closeModal = document.querySelector(".close-modal");
const closePreviewBtn = document.querySelector(".close-preview-btn");
const copyPreviewBtn = document.querySelector(".copy-preview-btn");
const previewTabs = document.querySelectorAll(".preview-tab");
const visualPreviewContainer = document.getElementById(
  "visual-preview-container"
);

let uploadedImages = [];
let model = null;

// Initialize TensorFlow.js and MobileNet
async function initTensorFlow() {
  try {
    model = await mobilenet.load();
    console.log("MobileNet model loaded successfully");
  } catch (error) {
    console.error("Failed to load MobileNet model:", error);
    alert("Failed to load AI model. Please try again later.");
  }
}

// Call initialization
initTensorFlow();

// Event Listeners
uploadArea.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", handleFileSelect);

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("active");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("active");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("active");

  if (e.dataTransfer.files) {
    handleFiles(e.dataTransfer.files);
  }
});

generateBtn.addEventListener("click", generateGrids);

// Setup download and copy buttons
document.querySelectorAll(".download-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    const gridType = this.getAttribute("data-grid");
    downloadGrid(gridType);
  });
});

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    const gridType = this.getAttribute("data-grid");
    copyGridCode(gridType);
  });
});

// Setup preview buttons
document.querySelectorAll(".preview-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    const gridType = this.getAttribute("data-grid");
    showCodePreview(gridType);
  });
});

// Close modal events
if (closeModal) {
  closeModal.addEventListener("click", closeCodePreview);
}

if (closePreviewBtn) {
  closePreviewBtn.addEventListener("click", closeCodePreview);
}

window.addEventListener("click", function (event) {
  if (modal && event.target === modal) {
    closeCodePreview();
  }
});

// Tab switching in preview
if (previewTabs) {
  previewTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      previewTabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      this.classList.add("active");

      const tabType = this.getAttribute("data-tab");
      showPreviewContent(tabType);
    });
  });
}

// Copy all code button
if (copyPreviewBtn) {
  copyPreviewBtn.addEventListener("click", function () {
    const currentGrid = copyPreviewBtn.getAttribute("data-grid");
    copyGridCode(currentGrid);

    // Show copied feedback
    const originalText = copyPreviewBtn.textContent;
    copyPreviewBtn.textContent = "Copied!";

    setTimeout(() => {
      copyPreviewBtn.textContent = originalText;
    }, 2000);
  });
}

// Functions
function handleFileSelect(e) {
  handleFiles(e.target.files);
}

function handleFiles(files) {
  // Filter only image files
  const imageFiles = Array.from(files).filter((file) =>
    file.type.startsWith("image/")
  );

  // Check if the total number of images will exceed 5
  if (uploadedImages.length + imageFiles.length > 5) {
    alert("You can only upload a maximum of 5 images.");
    return;
  }

  // Process each image file
  imageFiles.forEach((file) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const imageObj = {
          file: file,
          dataUrl: e.target.result,
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
        };

        uploadedImages.push(imageObj);
        addThumbnail(imageObj, uploadedImages.length - 1);

        // Enable generate button if we have at least 3 images
        if (uploadedImages.length >= 3) {
          generateBtn.disabled = false;
        }

        // Disable the upload if we have 5 images
        if (uploadedImages.length >= 5) {
          uploadArea.style.opacity = "0.5";
          uploadArea.style.pointerEvents = "none";
          fileInput.disabled = true;
        }
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

function addThumbnail(imageObj, index) {
  const thumbnail = document.createElement("div");
  thumbnail.className = "thumbnail";

  const img = document.createElement("img");
  img.src = imageObj.dataUrl;

  const removeBtn = document.createElement("div");
  removeBtn.className = "remove";
  removeBtn.innerHTML = "×";
  removeBtn.addEventListener("click", () => removeThumbnail(index));

  thumbnail.appendChild(img);
  thumbnail.appendChild(removeBtn);
  thumbnailsContainer.appendChild(thumbnail);
}

function removeThumbnail(index) {
  // Remove the image from the array
  uploadedImages.splice(index, 1);

  // Rebuild thumbnails
  thumbnailsContainer.innerHTML = "";
  uploadedImages.forEach((img, i) => {
    addThumbnail(img, i);
  });

  // Update UI based on current image count
  if (uploadedImages.length < 3) {
    generateBtn.disabled = true;
  }

  if (uploadedImages.length < 5) {
    uploadArea.style.opacity = "1";
    uploadArea.style.pointerEvents = "auto";
    fileInput.disabled = false;
  }
}

async function analyzeImage(imageObj) {
  return new Promise(async (resolve) => {
    try {
      // Create an image element for TensorFlow to analyze
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageObj.dataUrl;

      img.onload = async () => {
        // Use MobileNet to classify the image
        const predictions = await model.classify(img);

        // Extract color data
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Sample points from the image to get dominant colors
        const colorSamples = [];
        for (let i = 0; i < 10; i++) {
          const x = Math.floor(Math.random() * img.width);
          const y = Math.floor(Math.random() * img.height);
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          colorSamples.push(`rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`);
        }

        // Find dominant color by frequency
        const colorCounts = {};
        let dominantColor = colorSamples[0];
        let maxCount = 0;

        colorSamples.forEach((color) => {
          colorCounts[color] = (colorCounts[color] || 0) + 1;
          if (colorCounts[color] > maxCount) {
            maxCount = colorCounts[color];
            dominantColor = color;
          }
        });

        resolve({
          predictions: predictions,
          dominantColor: dominantColor,
          allColors: colorSamples,
          aspectRatio: imageObj.aspectRatio,
          isLandscape: imageObj.width > imageObj.height,
          isPortrait: imageObj.height > imageObj.width,
          isSquare: Math.abs(imageObj.width - imageObj.height) < 20,
        });
      };
    } catch (error) {
      console.error("Error analyzing image:", error);
      resolve({
        predictions: [{ className: "unknown", probability: 1 }],
        dominantColor: "rgb(200, 200, 200)",
        allColors: ["rgb(200, 200, 200)"],
        aspectRatio: imageObj.aspectRatio,
        isLandscape: imageObj.width > imageObj.height,
        isPortrait: imageObj.height > imageObj.width,
        isSquare: Math.abs(imageObj.width - imageObj.height) < 20,
      });
    }
  });
}

async function generateGrids() {
  if (uploadedImages.length < 3) {
    alert("Please upload at least 3 images.");
    return;
  }

  // Show loading state
  loadingSection.style.display = "block";
  uploadSection.style.display = "none";

  try {
    // Analyze all images
    const imageAnalysis = await Promise.all(
      uploadedImages.map((img) => analyzeImage(img))
    );

    // Generate grid layouts
    createMinimalistGrid(uploadedImages, imageAnalysis);
    createPlayfulGrid(uploadedImages, imageAnalysis);
    createBalancedGrid(uploadedImages, imageAnalysis);

    // Hide loading and show grids
    loadingSection.style.display = "none";
    gridsSection.style.display = "block";

    // Smooth scroll to grids
    gridsSection.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Error generating grids:", error);
    alert("There was an error generating your Bento grids. Please try again.");
    loadingSection.style.display = "none";
    uploadSection.style.display = "block";
  }
}

function createMinimalistGrid(images, analysis) {
  minimalistGrid.innerHTML = "";

  // Sort images by their aspect ratio and analysis to find optimal arrangement
  const sortedImages = [...images].map((img, index) => ({
    img,
    analysis: analysis[index],
    index,
  }));

  // Find the best hero image (large landscape for hero position)
  // Prefer landscape images with clear subjects (high confidence)
  let heroIndex = 0;
  let highestScore = 0;

  sortedImages.forEach((item, idx) => {
    const isLandscape = item.analysis.isLandscape;
    const confidence = item.analysis.predictions[0].probability;
    // Landscape images get higher scores for hero position
    const score = (isLandscape ? 2 : 0) + confidence;

    if (score > highestScore) {
      highestScore = score;
      heroIndex = idx;
    }
  });

  // Move hero to front
  const heroItem = sortedImages.splice(heroIndex, 1)[0];
  sortedImages.unshift(heroItem);

  // For remaining images, prioritize layout by aspect ratio
  // Sort smaller slots by aspect ratio (portrait for tall slots, landscape for wide slots)
  const remainingSlots = [
    { slotIndex: 1, prefersPortrait: false }, // top right (prefers landscape)
    { slotIndex: 2, prefersPortrait: true }, // middle right (prefers portrait)
    { slotIndex: 3, prefersPortrait: false }, // bottom left (prefers landscape)
    { slotIndex: 4, prefersPortrait: false }, // bottom right (prefers landscape)
  ];

  // Add all images to grid
  sortedImages.forEach((item, idx) => {
    const gridItem = document.createElement("div");
    gridItem.className = "grid-item";

    const img = document.createElement("img");
    img.src = item.img.dataUrl;
    img.alt = `Image ${idx + 1}`;

    gridItem.appendChild(img);
    minimalistGrid.appendChild(gridItem);
  });
}

function createPlayfulGrid(images, analysis) {
  playfulGrid.innerHTML = "";

  // Sort images by their aspect ratio for optimal placement
  const sortedImages = [...images].map((img, index) => ({
    img,
    analysis: analysis[index],
    index,
  }));

  // Define grid positions with preferred aspect ratios
  const positions = [
    { gridArea: "1 / 1 / span 1 / span 2", prefersLandscape: true }, // top left, wide
    { gridArea: "1 / 3 / span 2 / span 1", prefersPortrait: true }, // top right, tall
    { gridArea: "2 / 1 / span 2 / span 1", prefersPortrait: true }, // middle left, tall
    { gridArea: "2 / 2 / span 1 / span 1", prefersSquare: true }, // middle, square
    { gridArea: "3 / 2 / span 1 / span 2", prefersLandscape: true }, // bottom right, wide
  ];

  // Assign images to positions based on aspect ratio match
  const assignedPositions = [];
  const assignedImages = [];

  // First pass: assign images with strong aspect ratio preferences
  positions.forEach((position, posIdx) => {
    // Skip if this position already has an image
    if (assignedPositions.includes(posIdx)) return;

    // Find best matching image
    let bestMatch = -1;
    let bestMatchScore = -1;

    sortedImages.forEach((item, imgIdx) => {
      // Skip if this image is already assigned
      if (assignedImages.includes(imgIdx)) return;

      let score = 0;
      if (position.prefersLandscape && item.analysis.isLandscape) score += 2;
      if (position.prefersPortrait && item.analysis.isPortrait) score += 2;
      if (position.prefersSquare && item.analysis.isSquare) score += 2;

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = imgIdx;
      }
    });

    // If we found a good match, assign it
    if (bestMatch >= 0 && bestMatchScore > 0) {
      assignedPositions.push(posIdx);
      assignedImages.push(bestMatch);
    }
  });

  // Second pass: assign remaining images to remaining positions
  positions.forEach((position, posIdx) => {
    // Skip if this position already has an image
    if (assignedPositions.includes(posIdx)) return;

    // Find any unassigned image
    for (let imgIdx = 0; imgIdx < sortedImages.length; imgIdx++) {
      if (!assignedImages.includes(imgIdx)) {
        assignedPositions.push(posIdx);
        assignedImages.push(imgIdx);
        break;
      }
    }
  });

  // Create grid items in the assigned order
  const usedImages = [];
  positions.forEach((position, posIdx) => {
    // Find which image was assigned to this position
    const imgIdx = assignedImages[assignedPositions.indexOf(posIdx)];

    // If no image was assigned, use any remaining image
    let itemData;
    if (imgIdx !== undefined) {
      itemData = sortedImages[imgIdx];
      usedImages.push(imgIdx);
    } else {
      // Find first unused image
      for (let i = 0; i < sortedImages.length; i++) {
        if (!usedImages.includes(i)) {
          itemData = sortedImages[i];
          usedImages.push(i);
          break;
        }
      }
    }

    // Skip if we ran out of images
    if (!itemData) return;

    const gridItem = document.createElement("div");
    gridItem.className = "grid-item";
    gridItem.style.gridArea = position.gridArea;

    // Apply border color from image analysis
    const borderColor = itemData.analysis.dominantColor;
    gridItem.style.borderLeft = `4px solid ${borderColor}`;

    const img = document.createElement("img");
    img.src = itemData.img.dataUrl;
    img.alt = `Image ${itemData.index + 1}`;

    gridItem.appendChild(img);
    playfulGrid.appendChild(gridItem);
  });
}

function createBalancedGrid(images, analysis) {
  balancedGrid.innerHTML = "";

  // Get subset of images if more than 4
  const gridImages = images.slice(0, 4);
  const gridAnalysis = analysis.slice(0, 4);

  // Sort images by aspect ratio
  const sortedImages = [...gridImages]
    .map((img, index) => ({
      img,
      analysis: gridAnalysis[index],
      index,
    }))
    .sort((a, b) => {
      // Sort by aspect ratio, landscape first
      if (a.analysis.isLandscape && !b.analysis.isLandscape) return -1;
      if (!a.analysis.isLandscape && b.analysis.isLandscape) return 1;
      return 0;
    });

  // Simple 2x2 grid - place landscape images in the top row
  sortedImages.forEach((item, idx) => {
    const gridItem = document.createElement("div");
    gridItem.className = "grid-item";

    const img = document.createElement("img");
    img.src = item.img.dataUrl;
    img.alt = `Image ${item.index + 1}`;

    gridItem.appendChild(img);
    balancedGrid.appendChild(gridItem);
  });
}

async function downloadGrid(gridType) {
  const gridElement = document.getElementById(`${gridType}-grid`);

  try {
    // Configure html2canvas with higher settings for better quality
    const canvas = await html2canvas(gridElement, {
      backgroundColor: null,
      scale: 4, // Increased from 2 to 4 for higher resolution
      useCORS: true,
      logging: false,
      allowTaint: true,
      imageTimeout: 0,
      removeContainer: true,
      letterRendering: true,
      renderSettings: {
        async: true,
      },
    });

    // Create a link to download the high-resolution image
    const link = document.createElement("a");
    link.download = `${gridType}-bento-grid.png`;

    // Use higher quality for the PNG image
    link.href = canvas.toDataURL("image/png", 1.0); // Use maximum quality (1.0)
    link.click();
  } catch (error) {
    console.error("Error downloading grid:", error);
    alert("There was an error downloading your grid. Please try again.");
  }
}

// Show code preview modal
function showCodePreview(gridType) {
  if (!modal) return;

  // Set the current grid type for the copy button
  copyPreviewBtn.setAttribute("data-grid", gridType);

  // Update modal title
  previewTitle.textContent = `${
    gridType.charAt(0).toUpperCase() + gridType.slice(1)
  } Grid Code`;

  // Get the grid HTML and CSS
  const gridElement = document.getElementById(`${gridType}-grid`);
  let htmlCode = gridElement.outerHTML;
  let cssCode = generateGridCSS(gridType);

  // Format HTML with syntax highlighting (basic version)
  htmlCode = htmlCode.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Default to HTML tab
  previewTabs[0].click();

  // Create a visual preview
  createVisualPreview(gridType);

  // Show the modal
  modal.style.display = "block";
}

// Generate CSS for preview
function generateGridCSS(gridType) {
  // This uses the same code from the copyGridCode function
  if (gridType === "minimalist") {
    return `/* Minimalist Bento Grid CSS */
.bento-grid {
  display: grid;
  gap: 15px;
  width: 100%;
  aspect-ratio: 1 / 1;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
}

.grid-item:first-child {
  grid-column: span 3;
  grid-row: span 3;
}

.grid-item {
  overflow: hidden;
  border-radius: 8px;
}

.grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}`;
  } else if (gridType === "playful") {
    return `/* Playful Bento Grid CSS */
.bento-grid {
  display: grid;
  gap: 10px;
  width: 100%;
  aspect-ratio: 1 / 1;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

.grid-item {
  overflow: hidden;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.grid-item:nth-child(1) {
  grid-column: 1 / span 2;
  grid-row: 1 / span 1;
}

.grid-item:nth-child(2) {
  grid-column: 3 / span 1;
  grid-row: 1 / span 2;
}

.grid-item:nth-child(3) {
  grid-column: 1 / span 1;
  grid-row: 2 / span 2;
}

.grid-item:nth-child(4) {
  grid-column: 2 / span 1;
  grid-row: 2 / span 1;
}

.grid-item:nth-child(5) {
  grid-column: 2 / span 2;
  grid-row: 3 / span 1;
}

.grid-item:hover {
  transform: scale(1.02);
  z-index: 2;
}

.grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}`;
  } else if (gridType === "balanced") {
    return `/* Balanced Bento Grid CSS */
.bento-grid {
  display: grid;
  gap: 15px;
  width: 100%;
  aspect-ratio: 1 / 1;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}

.grid-item {
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}`;
  }
}

// Show the appropriate content based on selected tab
function showPreviewContent(tabType) {
  if (!copyPreviewBtn) return;

  const currentGrid = copyPreviewBtn.getAttribute("data-grid");
  const gridElement = document.getElementById(`${currentGrid}-grid`);

  // Hide/show visual preview
  if (tabType === "visual") {
    visualPreviewContainer.style.display = "block";
    codePreview.style.display = "none";
  } else {
    visualPreviewContainer.style.display = "none";
    codePreview.style.display = "block";
  }

  if (tabType === "html") {
    let htmlCode = gridElement.outerHTML;
    // Format HTML for display
    htmlCode = htmlCode.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    codePreview.innerHTML = htmlCode;
  } else if (tabType === "css") {
    codePreview.innerHTML = generateGridCSS(currentGrid);
  }
}

// Create a visual preview of the grid
function createVisualPreview(gridType) {
  if (!visualPreviewContainer) return;

  // Clone the grid for the visual preview
  const originalGrid = document.getElementById(`${gridType}-grid`);
  const previewGrid = originalGrid.cloneNode(true);

  // Clear the container and add the cloned grid
  visualPreviewContainer.innerHTML = "";
  visualPreviewContainer.appendChild(previewGrid);
}

// Close the preview modal
function closeCodePreview() {
  if (modal) {
    modal.style.display = "none";
  }
}

// Copy grid code function
function copyGridCode(gridType) {
  const gridElement = document.getElementById(`${gridType}-grid`);

  // Get the HTML
  const gridHTML = gridElement.outerHTML;

  // Get the CSS
  const cssText = generateGridCSS(gridType);

  // Combine HTML and CSS
  const fullCode = `${gridHTML}\n\n<style>\n${cssText}\n</style>`;

  // Copy to clipboard
  navigator.clipboard
    .writeText(fullCode)
    .then(() => {
      // Create and show tooltip
      const btn = document.querySelector(`.copy-btn[data-grid="${gridType}"]`);
      btn.innerHTML = '<i class="fas fa-check"></i> <span>Copied!</span>';

      // Reset button text after 2 seconds
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-copy"></i> <span>Copy Code</span>';
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy code: ", err);
      alert("Failed to copy code to clipboard. Please try again.");
    });
}

// Add tooltip functionality
function createTooltip(element, message) {
  const tooltip = document.createElement("span");
  tooltip.className = "tooltiptext";
  tooltip.textContent = message;
  element.appendChild(tooltip);
}

// Function to get a vibrant color palette from image analysis
function getColorPalette(analysis) {
  // Extract colors from all images and filter out very dark or very light colors
  const allColors = analysis.flatMap((result) => result.allColors);

  const filteredColors = allColors.filter((color) => {
    const rgb = color.match(/\d+/g).map(Number);
    const brightness = (rgb[0] + rgb[1] + rgb[2]) / 3;
    return brightness > 30 && brightness < 225; // Not too dark or light
  });

  // Get unique colors
  const uniqueColors = [...new Set(filteredColors)];

  // Return a subset of colors or fallback colors if not enough
  const fallbackColors = [
    "#6366f1",
    "#f472b6",
    "#facc15",
    "#34d399",
    "#fb923c",
  ];

  return uniqueColors.length >= 3 ? uniqueColors.slice(0, 5) : fallbackColors;
}
