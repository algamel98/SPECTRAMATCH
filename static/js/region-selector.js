/**
 * Region Selector Module
 * Modern UI for selecting analysis regions on images
 * Features: click-to-place, drag-to-move, wheel-to-resize, dimming effect
 */

var RegionSelector = (function() {
    'use strict';

    // State
    var state = {
        isPlaced: false,
        isDragging: false,
        shape: 'circle', // 'circle', 'square', 'rectangle'
        // Dimensions for each shape type
        circleDiameter: 100,
        squareSize: 100,
        rectangleWidth: 150,
        rectangleHeight: 100,
        // Current effective size (for backward compatibility)
        size: 100,
        width: 100,
        height: 100,
        // Position as percentage of image dimensions (0-1)
        posX: 0.5,
        posY: 0.5,
        // Image dimensions for coordinate conversion
        refImageWidth: 0,
        refImageHeight: 0,
        testImageWidth: 0,
        testImageHeight: 0,
        // Original image dimensions (actual file dimensions)
        refOriginalWidth: 0,
        refOriginalHeight: 0,
        testOriginalWidth: 0,
        testOriginalHeight: 0,
        // Drag offset
        dragOffsetX: 0,
        dragOffsetY: 0,
        // Active panel being interacted with
        activePanel: null,
        // Enabled state
        enabled: true
    };

    // DOM elements cache
    var elements = {
        refPanel: null,
        testPanel: null,
        refImage: null,
        testImage: null,
        refContainer: null,
        testContainer: null,
        refOverlay: null,
        testOverlay: null,
        refDimmer: null,
        testDimmer: null,
        sizeSlider: null,
        sizeValue: null
    };

    /**
     * Initialize the region selector
     */
    function init() {
        cacheElements();
        createDimmerElements();
        bindEvents();
        updateSizeDisplay();
        
        // Initial state - not placed until user clicks
        hideSelection();
        
        console.log('RegionSelector initialized');
    }

    /**
     * Cache DOM elements
     */
    function cacheElements() {
        elements.refPanel = document.getElementById('refPanelContent');
        elements.testPanel = document.getElementById('testPanelContent');
        elements.refImage = document.getElementById('refPreview');
        elements.testImage = document.getElementById('testPreview');
        elements.refContainer = elements.refPanel;
        elements.testContainer = elements.testPanel;
        elements.refOverlay = document.getElementById('refOverlay');
        elements.testOverlay = document.getElementById('testOverlay');
        elements.sizeSlider = document.getElementById('shapeSize');
        elements.sizeValue = document.getElementById('sizeValue');
    }

    /**
     * Create dimmer overlay elements for both panels
     */
    function createDimmerElements() {
        // Create dimmer for reference panel
        if (elements.refPanel && !document.getElementById('refDimmer')) {
            elements.refDimmer = document.createElement('div');
            elements.refDimmer.id = 'refDimmer';
            elements.refDimmer.className = 'region-dimmer';
            elements.refPanel.appendChild(elements.refDimmer);
        }

        // Create dimmer for test panel
        if (elements.testPanel && !document.getElementById('testDimmer')) {
            elements.testDimmer = document.createElement('div');
            elements.testDimmer.id = 'testDimmer';
            elements.testDimmer.className = 'region-dimmer';
            elements.testPanel.appendChild(elements.testDimmer);
        }
    }

    /**
     * Bind all event listeners
     */
    function bindEvents() {
        // Reference panel events
        if (elements.refPanel) {
            elements.refPanel.addEventListener('click', handlePanelClick);
            elements.refPanel.addEventListener('mousedown', handleMouseDown);
            elements.refPanel.addEventListener('wheel', handleWheel, { passive: false });
        }

        // Test panel events
        if (elements.testPanel) {
            elements.testPanel.addEventListener('click', handlePanelClick);
            elements.testPanel.addEventListener('mousedown', handleMouseDown);
            elements.testPanel.addEventListener('wheel', handleWheel, { passive: false });
        }

        // Global mouse events for dragging
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Size slider
        if (elements.sizeSlider) {
            elements.sizeSlider.addEventListener('input', handleSliderChange);
        }

        // Shape radio buttons
        var shapeRadios = document.querySelectorAll('input[name="shapeType"]');
        shapeRadios.forEach(function(radio) {
            radio.addEventListener('change', handleShapeChange);
        });

        // Process full image checkbox
        var fullImageCheckbox = document.getElementById('processFullImage');
        if (fullImageCheckbox) {
            fullImageCheckbox.addEventListener('change', handleFullImageToggle);
        }

        // Listen for image load to get dimensions
        if (elements.refImage) {
            elements.refImage.addEventListener('load', function() {
                updateImageDimensions('ref');
            });
        }
        if (elements.testImage) {
            elements.testImage.addEventListener('load', function() {
                updateImageDimensions('test');
            });
        }
    }

    /**
     * Update image dimensions when images are loaded
     */
    function updateImageDimensions(type) {
        if (type === 'ref' && elements.refImage) {
            state.refImageWidth = elements.refImage.clientWidth;
            state.refImageHeight = elements.refImage.clientHeight;
            state.refOriginalWidth = elements.refImage.naturalWidth;
            state.refOriginalHeight = elements.refImage.naturalHeight;
        } else if (type === 'test' && elements.testImage) {
            state.testImageWidth = elements.testImage.clientWidth;
            state.testImageHeight = elements.testImage.clientHeight;
            state.testOriginalWidth = elements.testImage.naturalWidth;
            state.testOriginalHeight = elements.testImage.naturalHeight;
        }
        
        // Update selection if placed
        if (state.isPlaced) {
            updateSelectionDisplay();
        }
    }

    /**
     * Handle click on panel to place selection
     */
    function handlePanelClick(e) {
        if (!state.enabled || state.isDragging) return;
        
        // Don't place if clicking on overlay (will start drag instead)
        if (e.target.classList.contains('region-overlay') || 
            e.target.classList.contains('region-handle')) {
            return;
        }

        var panel = e.currentTarget;
        var rect = panel.getBoundingClientRect();
        var image = panel.querySelector('.image-preview');
        
        if (!image || image.style.display === 'none') return;

        // Get image bounds within panel
        var imgRect = image.getBoundingClientRect();
        
        // Calculate position relative to image
        var x = e.clientX - imgRect.left;
        var y = e.clientY - imgRect.top;
        
        // Convert to percentage
        state.posX = Math.max(0, Math.min(1, x / imgRect.width));
        state.posY = Math.max(0, Math.min(1, y / imgRect.height));
        
        state.isPlaced = true;
        showSelection();
        updateSelectionDisplay();
    }

    /**
     * Handle mouse down on overlay for dragging
     */
    function handleMouseDown(e) {
        if (!state.enabled || !state.isPlaced) return;
        
        var overlay = e.target.closest('.region-overlay');
        if (!overlay) return;
        
        e.preventDefault();
        state.isDragging = true;
        state.activePanel = e.currentTarget;
        
        var rect = overlay.getBoundingClientRect();
        state.dragOffsetX = e.clientX - rect.left - rect.width / 2;
        state.dragOffsetY = e.clientY - rect.top - rect.height / 2;
        
        document.body.style.cursor = 'grabbing';
        overlay.classList.add('dragging');
    }

    /**
     * Handle mouse move for dragging
     */
    function handleMouseMove(e) {
        if (!state.isDragging || !state.activePanel) return;
        
        var image = state.activePanel.querySelector('.image-preview');
        if (!image || image.style.display === 'none') return;
        
        var imgRect = image.getBoundingClientRect();
        
        // Calculate new position
        var x = e.clientX - imgRect.left - state.dragOffsetX;
        var y = e.clientY - imgRect.top - state.dragOffsetY;
        
        // Convert to percentage and clamp
        state.posX = Math.max(0, Math.min(1, x / imgRect.width));
        state.posY = Math.max(0, Math.min(1, y / imgRect.height));
        
        updateSelectionDisplay();
    }

    /**
     * Handle mouse up to end dragging
     */
    function handleMouseUp(e) {
        if (state.isDragging) {
            state.isDragging = false;
            state.activePanel = null;
            document.body.style.cursor = '';
            
            var overlays = document.querySelectorAll('.region-overlay');
            overlays.forEach(function(o) { o.classList.remove('dragging'); });
        }
    }

    /**
     * Handle mouse wheel for resizing
     */
    function handleWheel(e) {
        if (!state.enabled || !state.isPlaced) return;
        
        // Only resize if over image area
        var panel = e.currentTarget;
        var image = panel.querySelector('.image-preview');
        if (!image || image.style.display === 'none') return;
        
        e.preventDefault();
        
        // Calculate delta
        var delta = e.deltaY > 0 ? -10 : 10;
        
        // Update the appropriate dimension based on shape
        switch (state.shape) {
            case 'circle':
                state.circleDiameter = Math.max(20, Math.min(500, state.circleDiameter + delta));
                break;
            case 'square':
                state.squareSize = Math.max(20, Math.min(500, state.squareSize + delta));
                break;
            case 'rectangle':
                // For rectangle, scale both dimensions proportionally
                var ratio = state.rectangleHeight / state.rectangleWidth;
                state.rectangleWidth = Math.max(20, Math.min(500, state.rectangleWidth + delta));
                state.rectangleHeight = Math.max(20, Math.min(500, Math.round(state.rectangleWidth * ratio)));
                break;
        }
        
        // Update slider if present
        if (elements.sizeSlider) {
            var currentDim = getCurrentDimensions();
            elements.sizeSlider.value = currentDim.width;
        }
        
        // Also update AppState
        if (typeof AppState !== 'undefined') {
            AppState.shapeSize = getCurrentDimensions().width;
        }
        
        updateSizeDisplay();
        updateSelectionDisplay();
        syncSettingsInputs();
        
        // Update shape preview in app.js
        if (typeof updateShapePreview === 'function') {
            updateShapePreview();
        }
    }

    /**
     * Handle slider change
     */
    function handleSliderChange(e) {
        var newSize = parseInt(e.target.value);
        
        // Update the appropriate dimension based on shape
        switch (state.shape) {
            case 'circle':
                state.circleDiameter = newSize;
                break;
            case 'square':
                state.squareSize = newSize;
                break;
            case 'rectangle':
                // For rectangle via slider, scale both proportionally
                var ratio = state.rectangleHeight / state.rectangleWidth;
                state.rectangleWidth = newSize;
                state.rectangleHeight = Math.round(newSize * ratio);
                break;
        }
        
        // Also update AppState
        if (typeof AppState !== 'undefined') {
            AppState.shapeSize = newSize;
        }
        
        updateSizeDisplay();
        updateSelectionDisplay();
        syncSettingsInputs();
        
        // Update shape preview in app.js
        if (typeof updateShapePreview === 'function') {
            updateShapePreview();
        }
    }
    
    /**
     * Sync settings inputs in the modal with current state
     */
    function syncSettingsInputs() {
        var circleInput = document.getElementById('region_circle_diameter');
        var squareInput = document.getElementById('region_square_size');
        var rectWidthInput = document.getElementById('region_rect_width');
        var rectHeightInput = document.getElementById('region_rect_height');
        
        if (circleInput) circleInput.value = state.circleDiameter;
        if (squareInput) squareInput.value = state.squareSize;
        if (rectWidthInput) rectWidthInput.value = state.rectangleWidth;
        if (rectHeightInput) rectHeightInput.value = state.rectangleHeight;
    }

    /**
     * Handle shape change
     */
    function handleShapeChange(e) {
        state.shape = e.target.value;
        
        // Also update AppState
        if (typeof AppState !== 'undefined') {
            AppState.shapeType = state.shape;
        }
        
        updateSizeDisplay();
        updateSelectionDisplay();
        syncSettingsInputs();
        
        // Update shape preview in app.js
        if (typeof updateShapePreview === 'function') {
            updateShapePreview();
        }
    }

    /**
     * Handle full image toggle
     */
    function handleFullImageToggle(e) {
        state.enabled = !e.target.checked;
        
        if (state.enabled) {
            if (state.isPlaced) {
                showSelection();
            }
        } else {
            hideSelection();
        }
    }

    /**
     * Update the size display
     */
    function updateSizeDisplay() {
        if (elements.sizeValue) {
            var pxText = typeof I18n !== 'undefined' ? I18n.t('px') : 'px';
            var dimensions = getCurrentDimensions();
            
            if (state.shape === 'rectangle' && dimensions.width !== dimensions.height) {
                // Show width × height for rectangles
                elements.sizeValue.innerHTML = dimensions.width + '×' + dimensions.height + ' <span data-i18n="px">' + pxText + '</span>';
            } else {
                // Show single dimension for circles and squares
                elements.sizeValue.innerHTML = dimensions.width + ' <span data-i18n="px">' + pxText + '</span>';
            }
        }
        
        // Update slider value
        if (elements.sizeSlider) {
            var dimensions = getCurrentDimensions();
            elements.sizeSlider.value = dimensions.width;
        }
    }

    /**
     * Show the selection overlays
     */
    function showSelection() {
        if (!state.enabled) return;
        
        // Show overlays
        if (elements.refOverlay) {
            elements.refOverlay.style.display = '';
            elements.refOverlay.classList.add('placed');
        }
        if (elements.testOverlay) {
            elements.testOverlay.style.display = '';
            elements.testOverlay.classList.add('placed');
        }
        
        // Show dimmers
        if (elements.refDimmer) {
            elements.refDimmer.classList.add('active');
        }
        if (elements.testDimmer) {
            elements.testDimmer.classList.add('active');
        }
        
        updateSelectionDisplay();
    }

    /**
     * Hide the selection overlays
     */
    function hideSelection() {
        // Hide overlays
        if (elements.refOverlay) {
            elements.refOverlay.classList.remove('placed');
        }
        if (elements.testOverlay) {
            elements.testOverlay.classList.remove('placed');
        }
        
        // Hide dimmers
        if (elements.refDimmer) {
            elements.refDimmer.classList.remove('active');
        }
        if (elements.testDimmer) {
            elements.testDimmer.classList.remove('active');
        }
    }

    /**
     * Get current effective dimensions based on shape type
     */
    function getCurrentDimensions() {
        switch (state.shape) {
            case 'circle':
                return { width: state.circleDiameter, height: state.circleDiameter };
            case 'square':
                return { width: state.squareSize, height: state.squareSize };
            case 'rectangle':
                return { width: state.rectangleWidth, height: state.rectangleHeight };
            default:
                return { width: state.size, height: state.size };
        }
    }

    /**
     * Update the selection display on both images
     */
    function updateSelectionDisplay() {
        if (!state.isPlaced) return;
        
        var dimensions = getCurrentDimensions();
        state.width = dimensions.width;
        state.height = dimensions.height;
        state.size = Math.max(dimensions.width, dimensions.height);
        
        // Update reference overlay
        updateSingleOverlay(
            elements.refOverlay,
            elements.refDimmer,
            elements.refImage
        );
        
        // Update test overlay
        updateSingleOverlay(
            elements.testOverlay,
            elements.testDimmer,
            elements.testImage
        );
    }

    /**
     * Update a single overlay and dimmer
     * Ensures perfect circles and squares regardless of image aspect ratio
     */
    function updateSingleOverlay(overlay, dimmer, image) {
        if (!overlay || !image || image.style.display === 'none') return;
        
        var imgWidth = image.clientWidth;
        var imgHeight = image.clientHeight;
        
        if (imgWidth === 0 || imgHeight === 0) return;
        
        // Calculate pixel position
        var x = state.posX * imgWidth;
        var y = state.posY * imgHeight;
        
        var isCircle = state.shape === 'circle';
        var isSquare = state.shape === 'square';
        var isRectangle = state.shape === 'rectangle';
        
        // Get the overlay dimensions in pixels
        // For circles and squares, we use the same value for both width and height
        var overlayWidth, overlayHeight;
        
        if (isCircle) {
            overlayWidth = state.circleDiameter;
            overlayHeight = state.circleDiameter;
        } else if (isSquare) {
            overlayWidth = state.squareSize;
            overlayHeight = state.squareSize;
        } else {
            // Rectangle
            overlayWidth = state.rectangleWidth;
            overlayHeight = state.rectangleHeight;
        }
        
        // Update overlay position and size
        overlay.style.left = x + 'px';
        overlay.style.top = y + 'px';
        overlay.style.width = overlayWidth + 'px';
        overlay.style.height = overlayHeight + 'px';
        overlay.style.borderRadius = isCircle ? '50%' : '4px';
        overlay.style.opacity = '1';
        
        // Update dimmer mask
        if (dimmer) {
            updateDimmerMask(dimmer, x, y, overlayWidth, overlayHeight, imgWidth, imgHeight, isCircle);
        }
    }

    /**
     * Update the dimmer mask using CSS clip-path
     */
    function updateDimmerMask(dimmer, x, y, width, height, imgWidth, imgHeight, isCircle) {
        var halfWidth = width / 2;
        var halfHeight = height / 2;
        
        if (isCircle) {
            // Create circular cutout using radial gradient mask
            // For a perfect circle, we use the same radius value
            var centerXPercent = (x / imgWidth) * 100;
            var centerYPercent = (y / imgHeight) * 100;
            var radiusX = (halfWidth / imgWidth) * 100;
            var radiusY = (halfHeight / imgHeight) * 100;
            
            dimmer.style.maskImage = 'radial-gradient(ellipse ' + radiusX + '% ' + radiusY + '% at ' + 
                centerXPercent + '% ' + centerYPercent + '%, transparent 99%, black 100%)';
            dimmer.style.webkitMaskImage = dimmer.style.maskImage;
        } else {
            // Create rectangular cutout (works for both square and rectangle)
            var left = Math.max(0, x - halfWidth);
            var top = Math.max(0, y - halfHeight);
            var right = Math.min(imgWidth, x + halfWidth);
            var bottom = Math.min(imgHeight, y + halfHeight);
            
            // Convert to percentages
            var leftPct = (left / imgWidth) * 100;
            var topPct = (top / imgHeight) * 100;
            var rightPct = (right / imgWidth) * 100;
            var bottomPct = (bottom / imgHeight) * 100;
            
            // Create polygon that covers everything except the selection
            var clipPath = 'polygon(' +
                '0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ' +  // Outer
                leftPct + '% ' + topPct + '%, ' +
                leftPct + '% ' + bottomPct + '%, ' +
                rightPct + '% ' + bottomPct + '%, ' +
                rightPct + '% ' + topPct + '%, ' +
                leftPct + '% ' + topPct + '%)';
            
            dimmer.style.clipPath = clipPath;
            dimmer.style.webkitClipPath = clipPath;
            dimmer.style.maskImage = 'none';
            dimmer.style.webkitMaskImage = 'none';
        }
    }

    /**
     * Get crop settings for backend
     */
    function getCropSettings() {
        if (!state.isPlaced || !state.enabled) {
            return {
                use_crop: false
            };
        }

        // Get original image dimensions
        var origWidth = state.refOriginalWidth || 1;
        var origHeight = state.refOriginalHeight || 1;
        var displayWidth = state.refImageWidth || 1;
        var displayHeight = state.refImageHeight || 1;

        // Calculate scale factor between display and original
        var scaleX = origWidth / displayWidth;
        var scaleY = origHeight / displayHeight;

        // Convert position to original image coordinates
        var centerX = Math.round(state.posX * displayWidth * scaleX);
        var centerY = Math.round(state.posY * displayHeight * scaleY);
        
        // Get current dimensions based on shape
        var dimensions = getCurrentDimensions();
        
        // Scale dimensions to original image size
        var scaledWidth = Math.round(dimensions.width * scaleX);
        var scaledHeight = Math.round(dimensions.height * scaleY);

        return {
            use_crop: true,
            crop_shape: state.shape === 'circle' ? 'circle' : 'rectangle',
            crop_center_x: centerX,
            crop_center_y: centerY,
            crop_diameter: state.shape === 'circle' ? scaledWidth : Math.max(scaledWidth, scaledHeight),
            crop_width: scaledWidth,
            crop_height: scaledHeight
        };
    }

    /**
     * Reset the selection
     */
    function reset() {
        state.isPlaced = false;
        state.posX = 0.5;
        state.posY = 0.5;
        hideSelection();
    }

    /**
     * Set enabled state
     */
    function setEnabled(enabled) {
        state.enabled = enabled;
        if (!enabled) {
            hideSelection();
        } else if (state.isPlaced) {
            showSelection();
        }
    }

    /**
     * Set shape
     */
    function setShape(shape) {
        state.shape = shape;
        updateSizeDisplay();
        updateSelectionDisplay();
    }

    /**
     * Set size (backward compatibility - sets the current shape's primary dimension)
     */
    function setSize(size) {
        switch (state.shape) {
            case 'circle':
                state.circleDiameter = size;
                break;
            case 'square':
                state.squareSize = size;
                break;
            case 'rectangle':
                state.rectangleWidth = size;
                break;
        }
        state.size = size;
        updateSizeDisplay();
        updateSelectionDisplay();
    }
    
    /**
     * Set circle diameter
     */
    function setCircleDiameter(diameter) {
        state.circleDiameter = diameter;
        if (state.shape === 'circle') {
            updateSizeDisplay();
            updateSelectionDisplay();
        }
    }
    
    /**
     * Set square size
     */
    function setSquareSize(size) {
        state.squareSize = size;
        if (state.shape === 'square') {
            updateSizeDisplay();
            updateSelectionDisplay();
        }
    }
    
    /**
     * Set rectangle dimensions
     */
    function setRectangleDimensions(width, height) {
        state.rectangleWidth = width;
        state.rectangleHeight = height;
        if (state.shape === 'rectangle') {
            updateSizeDisplay();
            updateSelectionDisplay();
        }
    }
    
    /**
     * Get current state (for settings sync)
     */
    function getState() {
        return {
            shape: state.shape,
            circleDiameter: state.circleDiameter,
            squareSize: state.squareSize,
            rectangleWidth: state.rectangleWidth,
            rectangleHeight: state.rectangleHeight
        };
    }

    /**
     * Check if selection is placed
     */
    function isPlaced() {
        return state.isPlaced && state.enabled;
    }

    /**
     * Refresh dimensions (call after images load)
     */
    function refreshDimensions() {
        updateImageDimensions('ref');
        updateImageDimensions('test');
    }

    // Public API
    return {
        init: init,
        getCropSettings: getCropSettings,
        reset: reset,
        setEnabled: setEnabled,
        setShape: setShape,
        setSize: setSize,
        setCircleDiameter: setCircleDiameter,
        setSquareSize: setSquareSize,
        setRectangleDimensions: setRectangleDimensions,
        getState: getState,
        isPlaced: isPlaced,
        refreshDimensions: refreshDimensions,
        showSelection: showSelection,
        hideSelection: hideSelection
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Delay initialization to ensure other scripts have loaded
    setTimeout(function() {
        RegionSelector.init();
    }, 100);
});
