BentoBox: An simple AI Bento grid creator

A modern web application that uses AI to create beautiful, responsive Bento grid layouts from your photos. Upload 3-5 images and the app will generate three distinct grid layouts optimized for your specific photos.
Show Image
Features

AI-Powered Layout Generation: Uses TensorFlow.js and MobileNet to analyze image content and create optimized layouts
Smart Image Arrangement: Automatically positions images based on their aspect ratio and content
Three Layout Styles:

Minimalist: Clean design with one large hero image and smaller supporting images
Playful: Dynamic masonry-style layout with color accents from your images
Balanced: Symmetrical 2x2 grid optimized for your photos


High-Resolution Export: Download your grids as high-quality PNG images
Code Export: Copy HTML and CSS code for each layout to use in your projects
Live Preview: View generated code and rendered result before exporting

Technology Stack

HTML5: Structure and semantics
CSS3: Styling with modern CSS features (Grid, Flexbox, Animations)
JavaScript (ES6+): Core application logic
TensorFlow.js: Client-side machine learning for image analysis
MobileNet: Pre-trained neural network for image content detection
HTML2Canvas: High-quality grid export to PNG

How It Works

Image Analysis: When you upload photos, the app uses AI to:

Determine image content (what's in the photo)
Extract dominant colors
Calculate aspect ratios and dimensions


Smart Layout Generation: The app then:

Matches images to optimal grid positions based on their properties
Places landscape images in wide slots, portrait images in tall slots
Prioritizes visually striking images for hero positions


Responsive Design: All layouts are fully responsive and look great on any screen size

Getting Started
Installation
No installation required! This is a client-side application that runs entirely in your browser.

Clone the repository:
Copygit clone https://github.com/yourusername/bento-grid-creator.git

Open index.html in your web browser.

Alternatively, you can deploy the files to any static web hosting service.
Usage

Upload Photos: Drag and drop 3-5 images, or use the upload button
Generate Layouts: Click "Generate Bento Grids" to create your layouts
Explore Results: View the three different grid styles
Export: Download as PNG or copy the HTML/CSS code
Preview Code: Use the preview function to examine and modify the generated code

Browser Compatibility
The Bento Grid Creator works in all modern browsers that support JavaScript modules and CSS Grid:

Chrome (latest)
Firefox (latest)
Safari (latest)
Edge (latest)

Performance Considerations

All processing happens locally in your browser
Large images may take longer to process
The AI model (approximately 17MB) is loaded from a CDN on first use

Privacy

Your photos never leave your device - all processing is done client-side
No data is stored or transmitted to external servers

Customization
You can easily customize the grid styles by modifying the CSS. The key styling is located in:

styles.css: General application styling
The grid CSS generators in script.js: Specific grid layout styling

Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

Fork the repository
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

TensorFlow.js for browser-based machine learning
MobileNet for efficient image classification
HTML2Canvas for high-quality image export
Font Awesome for icons
Inter Font for typography


Created by Jake Cochran
