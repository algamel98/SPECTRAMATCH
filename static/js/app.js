/**
 * Textile QC System - Main Application
 * Version 2.0.0 - With Progress Tracking
 */

// ==========================================
// Application State
// ==========================================
var AppState = {
    sessionId: null,
    refFile: null,
    testFile: null,
    shapeType: 'circle',
    shapeSize: 100,
    processFullImage: true,
    analyzeSingleImage: false,
    pdfFilename: null,
    settingsPdfFilename: null,
    settings: {},
    isProcessing: false,
    // Manual sampling state
    manualSamplePoints: [],
    samplingMode: 'random' // 'random' or 'manual'
};

// ==========================================
// Progress Steps Configuration
// ==========================================
var ProgressSteps = {
    upload: { name: 'Uploading Images', weight: 10 },
    color: { name: 'Color Analysis', weight: 25 },
    pattern: { name: 'Pattern Analysis', weight: 25 },
    repetition: { name: 'Pattern Repetition', weight: 20 },
    scoring: { name: 'Calculating Scores', weight: 10 },
    report: { name: 'Generating Report', weight: 10 }
};

// ==========================================
// Initialize Application
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Textile QC System initialized');
    initLanguageSwitcher();
    initFileInputs();
    initShapeControls();
    initSingleImageMode();
    initButtons();
    initModal();
    initOverlayTracking();
    loadDefaultSettings();
    initCodeDownload();
    initDatasheetDownload();
    initSampleTests();
    initSamplingModeSelector();
    initPointSelectorModal();
    initFeedbackSidebar();
    initDevelopmentModal();
    initContactPopup();
    
    // Initialize samples language note
    updateSamplesLanguageNote();
    
    // Listen for language changes
    document.addEventListener('languageChanged', function(e) {
        // Re-translate dynamic content
        updateDynamicTranslations();
        updateFeedbackFormTranslations();
        // Update language toggle switch
        updateLanguageToggle();
    });
});

// ==========================================
// Language Switcher (Toggle Switch)
// ==========================================
function initLanguageSwitcher() {
    var toggle = document.getElementById('btnLanguageSwitcher');
    if (!toggle) return;
    
    // Wait a tiny bit to ensure I18n is initialized
    setTimeout(function() {
        // Set initial state based on current language
        updateLanguageToggle();
    }, 0);
    
    toggle.addEventListener('click', function() {
        var currentLang = I18n.getLanguage();
        var newLang = currentLang === 'en' ? 'tr' : 'en';
        I18n.setLanguage(newLang);
        // updateLanguageToggle will be called via languageChanged event
    });
}

function updateLanguageToggle() {
    var toggle = document.getElementById('btnLanguageSwitcher');
    if (!toggle) return;
    
    var wrapper = toggle.closest('.language-toggle-wrapper');
    if (!wrapper) return;
    
    var currentLang = I18n.getLanguage();
    // Turkish = left position (false), English = right position (true)
    toggle.setAttribute('aria-checked', currentLang === 'en' ? 'true' : 'false');
    toggle.classList.toggle('toggle-active', currentLang === 'en');
    
    // Update wrapper class for flag styling
    wrapper.classList.toggle('lang-en-active', currentLang === 'en');
    wrapper.classList.toggle('lang-tr-active', currentLang === 'tr');
    
    // Update title
    toggle.setAttribute('aria-label', currentLang === 'en' ? 'Türkçe\'ye Geç' : 'Switch to English');
    toggle.title = currentLang === 'en' ? 'Türkçe\'ye Geç' : 'Switch to English';
}

function updateDynamicTranslations() {
    // Update size value display
    var sizeValue = document.getElementById('sizeValue');
    if (sizeValue) {
        var size = AppState.shapeSize || 100;
        sizeValue.innerHTML = size + ' <span data-i18n="px">px</span>';
        // Re-translate px text
        var pxSpan = sizeValue.querySelector('span[data-i18n="px"]');
        if (pxSpan) pxSpan.textContent = I18n.t('px');
    }
    
    // Update operator name placeholder
    var operatorInput = document.getElementById('operator_name');
    if (operatorInput && !operatorInput.value) {
        operatorInput.placeholder = I18n.t('operator');
    }
    
    // Update single image mode label if active
    if (AppState.analyzeSingleImage) {
        var testPanel = document.querySelector('.viewer-panel:last-child');
        var testTitle = testPanel ? testPanel.querySelector('.panel-title') : null;
        var testTitleText = testTitle ? testTitle.querySelector('span:last-child') : null;
        if (testTitleText) {
            testTitleText.textContent = I18n.t('image.to.analyze');
        }
    }
    
    // Update help dialog if it's open
    if (currentHelpType) {
        var bodyEl = document.getElementById('helpDialogBody');
        var downloadBtn = document.getElementById('helpDialogDownload');
        if (bodyEl) {
            var content = getHelpContent(currentHelpType);
            if (content) {
                bodyEl.innerHTML = content.body;
            }
        }
        if (downloadBtn) {
            var btnSpan = downloadBtn.querySelector('span[data-i18n]');
            if (btnSpan) {
                btnSpan.textContent = I18n.t('download.this.format');
            }
        }
    }
    
    // Re-render sample cards if they exist
    if (SampleTestState.samples && SampleTestState.samples.length > 0) {
        renderSampleCards(SampleTestState.samples);
    }
    
    // Update samples language note
    updateSamplesLanguageNote();
}

// ==========================================
// File Input Handlers
// ==========================================
function initFileInputs() {
    var refInput = document.getElementById('refInput');
    var testInput = document.getElementById('testInput');
    
    if (refInput) {
        refInput.addEventListener('change', function(e) {
            if (e.target.files[0]) handleFileUpload(e.target.files[0], 'reference');
        });
    }
    
    if (testInput) {
        testInput.addEventListener('change', function(e) {
            if (e.target.files[0]) handleFileUpload(e.target.files[0], 'sample');
        });
    }
}

function handleFileUpload(file, type) {
    if (!file) return;
    
    var reader = new FileReader();
    reader.onload = function(e) {
        if (type === 'reference') {
            AppState.refFile = file;
            showImagePreview('ref', e.target.result, file.name);
        } else {
            AppState.testFile = file;
            showImagePreview('test', e.target.result, file.name);
        }
        updateButtonStates();
    };
    reader.onerror = function() {
        alert(I18n.t('error.reading.file'));
    };
    reader.readAsDataURL(file);
}

function showImagePreview(prefix, src, fileName) {
    var preview = document.getElementById(prefix + 'Preview');
    var placeholder = document.getElementById(prefix + 'Placeholder');
    var infoEmpty = document.getElementById(prefix + 'InfoEmpty');
    var infoName = document.getElementById(prefix + 'InfoName');
    var infoDimensions = document.getElementById(prefix + 'Info');
    
    if (preview && placeholder) {
        var img = new Image();
        img.onload = function() {
            preview.src = src;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
            
            // Update dimensions
            if (infoDimensions && img.width && img.height) {
                infoDimensions.textContent = img.width + '×' + img.height;
                infoDimensions.style.display = 'inline-block';
            }
            
            // Update filename (truncate to 20 chars max)
            if (infoName && fileName) {
                var displayName = fileName;
                if (displayName.length > 20) {
                    displayName = displayName.substring(0, 17) + '...';
                }
                infoName.textContent = displayName;
                infoName.title = fileName; // Full name on hover
            }
            
            // Hide empty text
            if (infoEmpty) infoEmpty.style.display = 'none';
            
            // Refresh RegionSelector dimensions after image loads
            setTimeout(function() {
                if (typeof RegionSelector !== 'undefined') {
                    RegionSelector.refreshDimensions();
                }
            }, 100);
        };
        img.src = src;
    }
}

// ==========================================
// Shape Controls
// ==========================================
function initShapeControls() {
    var radios = document.querySelectorAll('input[name="shapeType"]');
    radios.forEach(function(radio) {
        radio.addEventListener('change', function(e) {
            AppState.shapeType = e.target.value;
            updateShapeOptions();
            // Sync with RegionSelector
            if (typeof RegionSelector !== 'undefined') {
                RegionSelector.setShape(e.target.value);
            }
            // Sync with settings modal
            syncRegionShapeSettings(e.target.value);
            // Update shape preview
            updateShapePreview();
        });
    });
    
    var fullImageCheckbox = document.getElementById('processFullImage');
    if (fullImageCheckbox) {
        // Set initial state to match AppState
        fullImageCheckbox.checked = AppState.processFullImage;
        
        // Initialize shape controls based on initial state
        toggleShapeControls(!AppState.processFullImage);
        if (typeof RegionSelector !== 'undefined') {
            RegionSelector.setEnabled(!AppState.processFullImage);
        }
        
        fullImageCheckbox.addEventListener('change', function(e) {
            AppState.processFullImage = e.target.checked;
            toggleShapeControls(!e.target.checked);
            // Sync with RegionSelector
            if (typeof RegionSelector !== 'undefined') {
                RegionSelector.setEnabled(!e.target.checked);
            }
            // Update shape preview
            updateShapePreview();
        });
    }
    
    var sizeSlider = document.getElementById('shapeSize');
    var sizeValue = document.getElementById('sizeValue');
    if (sizeSlider && sizeValue) {
        sizeSlider.addEventListener('input', function(e) {
            AppState.shapeSize = parseInt(e.target.value);
            sizeValue.innerHTML = AppState.shapeSize + ' <span data-i18n="px">px</span>';
            // Re-translate px text
            var pxSpan = sizeValue.querySelector('span[data-i18n="px"]');
            if (pxSpan) pxSpan.textContent = I18n.t('px');
            // Sync with RegionSelector
            if (typeof RegionSelector !== 'undefined') {
                RegionSelector.setSize(AppState.shapeSize);
            }
            // Update shape preview
            updateShapePreview();
        });
    }
    
    // Initialize region shape settings in modal
    initRegionShapeSettings();
    
    // Initialize shape preview
    initShapePreview();
    
    // Initialize hint icon
    initHintIcon();
    
    updateShapeOptions();
}

// ==========================================
// Hint Icon (Question Mark)
// ==========================================
function initHintIcon() {
    var hintIcon = document.getElementById('regionHintIcon');
    if (hintIcon) {
        // Toggle on click
        hintIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            hintIcon.classList.toggle('active');
        });
        
        // Close when clicking outside
        document.addEventListener('click', function(e) {
            if (!hintIcon.contains(e.target)) {
                hintIcon.classList.remove('active');
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hintIcon.classList.remove('active');
            }
        });
    }
}

function updateShapeOptions() {
    var circleOpt = document.getElementById('circleOption');
    var squareOpt = document.getElementById('squareOption');
    var rectangleOpt = document.getElementById('rectangleOption');
    
    if (circleOpt) circleOpt.classList.toggle('active', AppState.shapeType === 'circle');
    if (squareOpt) squareOpt.classList.toggle('active', AppState.shapeType === 'square');
    if (rectangleOpt) rectangleOpt.classList.toggle('active', AppState.shapeType === 'rectangle');
}

function toggleShapeControls(enabled) {
    var circleOpt = document.getElementById('circleOption');
    var squareOpt = document.getElementById('squareOption');
    var rectangleOpt = document.getElementById('rectangleOption');
    var sliderContainer = document.getElementById('sizeSliderContainer');
    
    if (circleOpt) circleOpt.classList.toggle('disabled', !enabled);
    if (squareOpt) squareOpt.classList.toggle('disabled', !enabled);
    if (rectangleOpt) rectangleOpt.classList.toggle('disabled', !enabled);
    if (sliderContainer) sliderContainer.classList.toggle('disabled', !enabled);
    
    updateOverlayVisibility();
}

// ==========================================
// Region Shape Settings (in Modal)
// ==========================================
function initRegionShapeSettings() {
    // Handle region shape radio buttons in modal
    var regionShapeRadios = document.querySelectorAll('input[name="region_shape"]');
    regionShapeRadios.forEach(function(radio) {
        radio.addEventListener('change', function(e) {
            var shape = e.target.value;
            AppState.shapeType = shape;
            
            // Update radio card styling
            updateRegionShapeCards(shape);
            
            // Show/hide dimension settings
            showRegionDimensionSettings(shape);
            
            // Sync with inline controls
            syncInlineShapeControls(shape);
            
            // Sync with RegionSelector
            if (typeof RegionSelector !== 'undefined') {
                RegionSelector.setShape(shape);
            }
            
            // Update shape preview
            updateShapePreview();
        });
    });
    
    // Handle dimension inputs
    var circleDiameterInput = document.getElementById('region_circle_diameter');
    var squareSizeInput = document.getElementById('region_square_size');
    var rectWidthInput = document.getElementById('region_rect_width');
    var rectHeightInput = document.getElementById('region_rect_height');
    
    if (circleDiameterInput) {
        circleDiameterInput.addEventListener('input', function(e) {
            var value = parseInt(e.target.value) || 100;
            if (typeof RegionSelector !== 'undefined') {
                RegionSelector.setCircleDiameter(value);
            }
            if (AppState.shapeType === 'circle') {
                syncSizeSlider(value);
            }
            // Update shape preview
            updateShapePreview();
        });
    }
    
    if (squareSizeInput) {
        squareSizeInput.addEventListener('input', function(e) {
            var value = parseInt(e.target.value) || 100;
            if (typeof RegionSelector !== 'undefined') {
                RegionSelector.setSquareSize(value);
            }
            if (AppState.shapeType === 'square') {
                syncSizeSlider(value);
            }
            // Update shape preview
            updateShapePreview();
        });
    }
    
    if (rectWidthInput) {
        rectWidthInput.addEventListener('input', function(e) {
            var width = parseInt(e.target.value) || 150;
            var height = parseInt(rectHeightInput.value) || 100;
            if (typeof RegionSelector !== 'undefined') {
                RegionSelector.setRectangleDimensions(width, height);
            }
            if (AppState.shapeType === 'rectangle') {
                syncSizeSlider(width);
            }
            // Update shape preview
            updateShapePreview();
        });
    }
    
    if (rectHeightInput) {
        rectHeightInput.addEventListener('input', function(e) {
            var width = parseInt(rectWidthInput.value) || 150;
            var height = parseInt(e.target.value) || 100;
            if (typeof RegionSelector !== 'undefined') {
                RegionSelector.setRectangleDimensions(width, height);
            }
            // Update shape preview
            updateShapePreview();
        });
    }
}

function updateRegionShapeCards(shape) {
    var cards = document.querySelectorAll('.radio-option-card');
    cards.forEach(function(card) {
        var radio = card.querySelector('input[type="radio"]');
        if (radio) {
            card.classList.toggle('active', radio.value === shape);
        }
    });
}

function showRegionDimensionSettings(shape) {
    var circleSettings = document.getElementById('circleDimensionSettings');
    var squareSettings = document.getElementById('squareDimensionSettings');
    var rectangleSettings = document.getElementById('rectangleDimensionSettings');
    
    if (circleSettings) circleSettings.style.display = shape === 'circle' ? 'block' : 'none';
    if (squareSettings) squareSettings.style.display = shape === 'square' ? 'block' : 'none';
    if (rectangleSettings) rectangleSettings.style.display = shape === 'rectangle' ? 'block' : 'none';
}

function syncRegionShapeSettings(shape) {
    // Sync modal radio buttons
    var modalRadio = document.querySelector('input[name="region_shape"][value="' + shape + '"]');
    if (modalRadio) {
        modalRadio.checked = true;
        updateRegionShapeCards(shape);
        showRegionDimensionSettings(shape);
    }
}

function syncInlineShapeControls(shape) {
    var inlineRadio = document.querySelector('input[name="shapeType"][value="' + shape + '"]');
    if (inlineRadio) {
        inlineRadio.checked = true;
        updateShapeOptions();
    }
}

function syncSizeSlider(value) {
    var sizeSlider = document.getElementById('shapeSize');
    var sizeValue = document.getElementById('sizeValue');
    
    if (sizeSlider) {
        sizeSlider.value = value;
    }
    if (sizeValue) {
        var pxText = typeof I18n !== 'undefined' ? I18n.t('px') : 'px';
        sizeValue.innerHTML = value + ' <span data-i18n="px">' + pxText + '</span>';
    }
    AppState.shapeSize = value;
    
    // Update shape preview
    updateShapePreview();
}

// ==========================================
// Shape Preview
// ==========================================
function updateShapePreview() {
    var preview = document.getElementById('shapePreview');
    var shapeName = document.getElementById('previewShapeName');
    var dimensions = document.getElementById('previewDimensions');
    var container = document.getElementById('shapePreviewContainer');
    
    if (!preview || !shapeName || !dimensions) return;
    
    // Get current shape and dimensions from RegionSelector if available
    var shape = AppState.shapeType || 'circle';
    var width, height;
    
    if (typeof RegionSelector !== 'undefined' && RegionSelector.getState) {
        var state = RegionSelector.getState();
        shape = state.shape;
        
        switch (shape) {
            case 'circle':
                width = state.circleDiameter;
                height = state.circleDiameter;
                break;
            case 'square':
                width = state.squareSize;
                height = state.squareSize;
                break;
            case 'rectangle':
                width = state.rectangleWidth;
                height = state.rectangleHeight;
                break;
            default:
                width = 100;
                height = 100;
        }
    } else {
        // Fallback to input values
        var circleInput = document.getElementById('region_circle_diameter');
        var squareInput = document.getElementById('region_square_size');
        var rectWidthInput = document.getElementById('region_rect_width');
        var rectHeightInput = document.getElementById('region_rect_height');
        
        switch (shape) {
            case 'circle':
                width = circleInput ? parseInt(circleInput.value) || 100 : 100;
                height = width;
                break;
            case 'square':
                width = squareInput ? parseInt(squareInput.value) || 100 : 100;
                height = width;
                break;
            case 'rectangle':
                width = rectWidthInput ? parseInt(rectWidthInput.value) || 150 : 150;
                height = rectHeightInput ? parseInt(rectHeightInput.value) || 100 : 100;
                break;
            default:
                width = 100;
                height = 100;
        }
    }
    
    // Only show preview for circle shape - hide for square/rectangle to keep main page clean
    if (container) {
        if (shape === 'circle') {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
            return; // Don't update preview if hidden
        }
    }
    
    // Calculate preview size (max 50px, maintain aspect ratio)
    var maxSize = 50;
    var scale = Math.min(maxSize / width, maxSize / height);
    var previewWidth = Math.round(width * scale);
    var previewHeight = Math.round(height * scale);
    
    // Update preview element
    preview.style.width = previewWidth + 'px';
    preview.style.height = previewHeight + 'px';
    preview.className = 'shape-preview ' + shape;
    
    // Update shape name with translation
    var shapeKey = shape;
    var translatedName = typeof I18n !== 'undefined' ? I18n.t(shapeKey) : shape.charAt(0).toUpperCase() + shape.slice(1);
    shapeName.textContent = translatedName;
    shapeName.setAttribute('data-i18n', shapeKey);
    
    // Update dimensions text
    if (width === height) {
        dimensions.textContent = width + ' px';
    } else {
        dimensions.textContent = width + ' × ' + height + ' px';
    }
    
    // Handle disabled state (Process Entire Image)
    var fullImageCheckbox = document.getElementById('processFullImage');
    if (container && fullImageCheckbox) {
        container.classList.toggle('disabled', fullImageCheckbox.checked);
    }
}

// Initialize shape preview on page load
function initShapePreview() {
    updateShapePreview();
    
    // Listen for process full image toggle
    var fullImageCheckbox = document.getElementById('processFullImage');
    if (fullImageCheckbox) {
        fullImageCheckbox.addEventListener('change', updateShapePreview);
    }
}

// ==========================================
// Overlay Tracking
// ==========================================
function initOverlayTracking() {
    var refPanel = document.getElementById('refPanelContent');
    var testPanel = document.getElementById('testPanelContent');
    
    var panels = AppState.analyzeSingleImage ? [testPanel] : [refPanel, testPanel];
    
    panels.forEach(function(panel) {
        if (!panel) return;
        
        panel.addEventListener('mousemove', function(e) {
            if (AppState.processFullImage) return;
            var rect = panel.getBoundingClientRect();
            moveOverlays(e.clientX - rect.left, e.clientY - rect.top);
        });
        
        panel.addEventListener('mouseenter', function() {
            if (!AppState.processFullImage) setOverlaysOpacity(1);
        });
        
        panel.addEventListener('mouseleave', function() {
            setOverlaysOpacity(0);
        });
    });
}

function moveOverlays(x, y) {
    var overlayIds = AppState.analyzeSingleImage ? ['testOverlay'] : ['refOverlay', 'testOverlay'];
    overlayIds.forEach(function(id) {
        var overlay = document.getElementById(id);
        if (overlay && overlay.style.display !== 'none') {
            overlay.style.left = x + 'px';
            overlay.style.top = y + 'px';
        }
    });
}

function setOverlaysOpacity(opacity) {
    var overlayIds = AppState.analyzeSingleImage ? ['testOverlay'] : ['refOverlay', 'testOverlay'];
    overlayIds.forEach(function(id) {
        var overlay = document.getElementById(id);
        if (overlay && overlay.style.display !== 'none') {
            overlay.style.opacity = opacity;
        }
    });
}

function updateOverlayShape() {
    var isCircle = AppState.shapeType === 'circle';
    var overlayIds = AppState.analyzeSingleImage ? ['testOverlay'] : ['refOverlay', 'testOverlay'];
    overlayIds.forEach(function(id) {
        var overlay = document.getElementById(id);
        if (overlay && overlay.style.display !== 'none') {
            overlay.style.borderRadius = isCircle ? '50%' : '0';
        }
    });
}

function updateOverlaySize() {
    var size = AppState.shapeSize;
    var overlayIds = AppState.analyzeSingleImage ? ['testOverlay'] : ['refOverlay', 'testOverlay'];
    overlayIds.forEach(function(id) {
        var overlay = document.getElementById(id);
        if (overlay && overlay.style.display !== 'none') {
            overlay.style.width = size + 'px';
            overlay.style.height = size + 'px';
        }
    });
}

// ==========================================
// Button Handlers
// ==========================================
function initButtons() {
    var btnSettings = document.getElementById('btnAdvancedSettings');
    if (btnSettings) btnSettings.addEventListener('click', openModal);
    
    var btnProcess = document.getElementById('btnStartProcessing');
    if (btnProcess) btnProcess.addEventListener('click', startProcessing);
    
    var btnDelete = document.getElementById('btnDeleteImages');
    if (btnDelete) btnDelete.addEventListener('click', deleteImages);
    
    var btnDownload = document.getElementById('btnDownload');
    if (btnDownload) btnDownload.addEventListener('click', downloadReport);
    
    var btnDownloadSettings = document.getElementById('btnDownloadSettings');
    if (btnDownloadSettings) btnDownloadSettings.addEventListener('click', downloadSettings);
}

function updateButtonStates() {
    var hasImages = AppState.analyzeSingleImage 
        ? AppState.testFile 
        : (AppState.refFile && AppState.testFile);
    var btnProcess = document.getElementById('btnStartProcessing');
    var btnDelete = document.getElementById('btnDeleteImages');
    
    if (btnProcess) btnProcess.disabled = !hasImages || AppState.isProcessing;
    if (btnDelete) btnDelete.disabled = !hasImages || AppState.isProcessing;
}

// ==========================================
// Single Image Mode
// ==========================================
function initSingleImageMode() {
    var checkbox = document.getElementById('analyzeSingleImage');
    if (!checkbox) return;
    
    checkbox.addEventListener('change', function(e) {
        AppState.analyzeSingleImage = e.target.checked;
        toggleSingleImageMode(e.target.checked);
        updateButtonStates();
    });
}

function toggleSingleImageMode(enabled) {
    var imageViewer = document.querySelector('.image-viewer');
    var refPanel = document.querySelector('.viewer-panel:first-child');
    var testPanel = document.querySelector('.viewer-panel:last-child');
    var testTitle = testPanel ? testPanel.querySelector('.panel-title') : null;
    var testTitleText = testTitle ? testTitle.querySelector('span:last-child') : null;
    var refInput = document.getElementById('refInput');
    var refPlaceholder = document.getElementById('refPlaceholder');
    
    if (!imageViewer || !refPanel || !testPanel) return;
    
    if (enabled) {
        // Add single image mode class
        imageViewer.classList.add('single-image-mode');
        
        // Disable reference input
        if (refInput) refInput.disabled = true;
        if (refPlaceholder) refPlaceholder.style.pointerEvents = 'none';
        
        // Hide reference panel with animation
        refPanel.classList.add('hiding');
        
        // Update test panel title
        if (testTitleText) {
            testTitleText.setAttribute('data-i18n', 'image.to.analyze');
            testTitleText.textContent = I18n.t('image.to.analyze');
            
            // Update dot color
            var dot = testTitle.querySelector('.dot');
            if (dot) {
                dot.classList.remove('sample');
                dot.classList.add('single');
            }
        }
        
        // Center test panel after animation
        setTimeout(function() {
            testPanel.classList.add('centering');
            refPanel.style.display = 'none';
            // Reinitialize overlay tracking for single image mode
            initOverlayTracking();
        }, 500);
        
    } else {
        // Remove single image mode
        imageViewer.classList.remove('single-image-mode');
        
        // Enable reference input
        if (refInput) refInput.disabled = false;
        if (refPlaceholder) refPlaceholder.style.pointerEvents = '';
        
        // Show reference panel
        refPanel.style.display = '';
        refPanel.classList.remove('hiding');
        
        // Reset test panel
        testPanel.classList.remove('centering');
        
        // Reset test panel title
        if (testTitleText) {
            testTitleText.setAttribute('data-i18n', 'sample.image');
            testTitleText.textContent = I18n.t('sample.image');
            
            // Reset dot color
            var dot = testTitle.querySelector('.dot');
            if (dot) {
                dot.classList.remove('single');
                dot.classList.add('sample');
            }
        }
        
        // Reinitialize overlay tracking for dual image mode
        setTimeout(function() {
            initOverlayTracking();
        }, 500);
    }
    
    // Update overlay visibility
    updateOverlayVisibility();
}

function updateOverlayVisibility() {
    var refOverlay = document.getElementById('refOverlay');
    var testOverlay = document.getElementById('testOverlay');
    
    if (AppState.analyzeSingleImage) {
        if (refOverlay) refOverlay.style.display = 'none';
        if (testOverlay) testOverlay.style.display = AppState.processFullImage ? 'none' : '';
    } else {
        if (refOverlay) refOverlay.style.display = AppState.processFullImage ? 'none' : '';
        if (testOverlay) testOverlay.style.display = AppState.processFullImage ? 'none' : '';
    }
}

// ==========================================
// Processing - Sequential Step Execution
// ==========================================
function startProcessing() {
    // Check if single image mode is enabled
    if (AppState.analyzeSingleImage) {
        if (!AppState.testFile) {
            alert(I18n.t('please.upload.image'));
            return;
        }
    } else {
        if (!AppState.refFile || !AppState.testFile) {
            alert(I18n.t('please.upload.both'));
            return;
        }
    }
    
    if (AppState.isProcessing) return;
    AppState.isProcessing = true;
    updateButtonStates();
    
    // Show progress modal and execute steps sequentially
    showProgressModal();
    executeSequentialSteps();
}

// Sequential step execution - each step completes before next begins
function executeSequentialSteps() {
    var settings = collectSettings();
    
    // Get crop settings from RegionSelector
    if (typeof RegionSelector !== 'undefined' && RegionSelector.isPlaced() && !AppState.processFullImage) {
        var cropSettings = RegionSelector.getCropSettings();
        settings.use_crop = cropSettings.use_crop;
        settings.crop_shape = cropSettings.crop_shape;
        settings.crop_center_x = cropSettings.crop_center_x;
        settings.crop_center_y = cropSettings.crop_center_y;
        settings.crop_diameter = cropSettings.crop_diameter;
        settings.crop_width = cropSettings.crop_width;
        settings.crop_height = cropSettings.crop_height;
    } else {
        settings.use_crop = false;
        // Backend only accepts 'circle' or 'rectangle', convert 'square' to 'rectangle'
        settings.crop_shape = AppState.shapeType === 'circle' ? 'circle' : 'rectangle';
        settings.crop_diameter = AppState.shapeSize;
        settings.crop_width = AppState.shapeSize;
        settings.crop_height = AppState.shapeSize;
    }
    
    // Store settings for API call
    ProgressState.analysisSettings = settings;
    
    // STEP 1: Upload Images
    activateStep('upload');
    
    var formData = new FormData();
    if (AppState.analyzeSingleImage) {
        formData.append('reference', AppState.testFile);
        formData.append('sample', AppState.testFile);
    } else {
        formData.append('reference', AppState.refFile);
        formData.append('sample', AppState.testFile);
    }
    
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(function(response) {
        if (!response.ok) {
            return response.json().then(function(data) {
                throw new Error(data.error || 'Upload failed');
            });
        }
        return response.json();
    })
    .then(function(data) {
        if (data.error) throw new Error(data.error);
        AppState.sessionId = data.session_id;
        
        // Mark upload as complete (green checkmark)
        markStepComplete('upload');
        
        // Start backend analysis and sequential UI steps
        return runSequentialAnalysis();
    })
    .then(function(data) {
        if (data.error) throw new Error(data.error);
        
        AppState.pdfFilename = data.pdf_filename;
        AppState.settingsPdfFilename = data.settings_pdf_filename;
        AppState.isProcessing = false;
        
        // Show results after final step is green
        setTimeout(function() {
            hideProgressModal();
            displayResults(data);
            updateButtonStates();
        }, 600);
    })
    .catch(function(error) {
        console.error('Processing error:', error);
        markStepFailed(ProgressState.currentStepId, error.message);
        AppState.isProcessing = false;
        
        setTimeout(function() {
            hideProgressModal();
            updateButtonStates();
            alert('Analysis Error:\n\n' + (error.message || 'Unknown error occurred'));
        }, 1500);
    });
}

// Run analysis with sequential step progression
function runSequentialAnalysis() {
    return new Promise(function(resolve, reject) {
        var settings = ProgressState.analysisSettings;
        var enabledAnalysisSteps = ProgressState.steps.filter(function(s) {
            return s.id !== 'upload';
        });
        
        // Track which step we're simulating
        var currentStepIndex = 0;
        var analysisComplete = false;
        var analysisResult = null;
        var analysisError = null;
        
        // Function to advance to next step (sequential)
        function advanceToNextStep() {
            if (analysisError) {
                reject(analysisError);
                return;
            }
            
            // If analysis is complete and all steps done, resolve
            if (analysisComplete && currentStepIndex >= enabledAnalysisSteps.length) {
                resolve(analysisResult);
                return;
            }
            
            // If we have more steps to show
            if (currentStepIndex < enabledAnalysisSteps.length) {
                var step = enabledAnalysisSteps[currentStepIndex];
                
                // Activate current step (shows spinner)
                activateStep(step.id);
                
                // Calculate step duration based on weight
                var baseDuration = 600;
                var stepDuration = baseDuration + (step.weight * 20);
                
                // If this is the last step (report), wait for actual completion
                if (step.id === 'report') {
                    // Check periodically if analysis is done
                    var checkInterval = setInterval(function() {
                        if (analysisComplete || analysisError) {
                            clearInterval(checkInterval);
                            if (analysisError) {
                                reject(analysisError);
                            } else {
                                markStepComplete(step.id);
                                setTimeout(function() {
                                    resolve(analysisResult);
                                }, 300);
                            }
                        }
                    }, 200);
                } else {
                    // For non-final steps, complete after duration
                    setTimeout(function() {
                        markStepComplete(step.id);
                        currentStepIndex++;
                        
                        // Small delay before next step starts
                        setTimeout(advanceToNextStep, 150);
                    }, stepDuration);
                }
            }
        }
        
        // Start the API call in parallel
        var controller = new AbortController();
        var timeoutId = setTimeout(function() {
            controller.abort();
        }, 300000); // 5 minute timeout
        
        fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: AppState.sessionId,
                settings: settings
            }),
            signal: controller.signal
        })
        .then(function(response) {
            clearTimeout(timeoutId);
            return response.text().then(function(text) {
                if (!text || text.trim() === '') {
                    throw new Error('Empty response from server');
                }
                try {
                    var data = JSON.parse(text);
                    if (data.error && data.decision === 'ERROR') {
                        // Include error details if available
                        var errorMsg = data.error;
                        if (data.error_details) {
                            console.error('Server error details:', data.error_details);
                        }
                        throw new Error(errorMsg);
                    }
                    return data;
                } catch (parseError) {
                    if (parseError.message && parseError.message !== 'Invalid response from server') {
                        throw parseError;
                    }
                    console.error('JSON parse error:', parseError);
                    console.error('Raw response:', text.substring(0, 500));
                    throw new Error('Invalid response from server');
                }
            });
        })
        .then(function(data) {
            analysisResult = data;
            analysisComplete = true;
        })
        .catch(function(error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                analysisError = new Error('Analysis timeout');
            } else {
                analysisError = error;
            }
        });
        
        // Start sequential step progression
        advanceToNextStep();
    });
}

// ==========================================
// Progress Modal - Sequential Steps with Green Checkmarks
// ==========================================

// Progress state management
var ProgressState = {
    steps: [],
    currentStepIndex: 0,
    currentStepId: null,
    completedCount: 0,
    totalSteps: 0,
    hasError: false,
    analysisSettings: null
};

// Get enabled steps based on user settings
function getEnabledSteps() {
    var settings = collectSettings();
    var steps = [];
    
    // Step 1: Upload (always)
    steps.push({ id: 'upload', label: I18n.t('upload.images'), weight: 10 });
    
    // Step 2: Color Analysis (if enabled)
    if (settings.enable_color_unit) {
        steps.push({ id: 'color', label: I18n.t('color.analysis.step'), weight: 25 });
    }
    
    // Step 3: Pattern Analysis (if enabled)
    if (settings.enable_pattern_unit) {
        steps.push({ id: 'pattern', label: I18n.t('pattern.analysis.step'), weight: 25 });
    }
    
    // Step 4: Pattern Repetition (if enabled)
    if (settings.enable_pattern_repetition) {
        steps.push({ id: 'repetition', label: I18n.t('pattern.repetition.step'), weight: 20 });
    }
    
    // Step 5: Calculate Scores (always)
    steps.push({ id: 'scoring', label: I18n.t('calculate.scores'), weight: 10 });
    
    // Step 6: Generate Report (always)
    steps.push({ id: 'report', label: I18n.t('generate.report'), weight: 10 });
    
    return steps;
}

// Show compact progress modal
function showProgressModal() {
    var overlay = document.getElementById('loadingOverlay');
    var content = document.querySelector('.loading-content');
    
    // Initialize state
    ProgressState.steps = getEnabledSteps();
    ProgressState.totalSteps = ProgressState.steps.length;
    ProgressState.currentStepIndex = 0;
    ProgressState.currentStepId = null;
    ProgressState.completedCount = 0;
    ProgressState.hasError = false;
    
    // Build steps HTML with neutral circles
    var stepsHtml = ProgressState.steps.map(function(step, index) {
        return '<div class="step" data-step="' + step.id + '" data-index="' + index + '">' +
               '<span class="step-icon-wrapper"><span class="step-icon">○</span></span>' +
               '<span class="step-label">' + step.label + '</span>' +
               '</div>';
    }).join('');
    
    if (content) {
        content.innerHTML = 
            '<div class="progress-modal">' +
                '<div class="progress-logo">' +
                    '<img src="/static/images/logo_square_with_name_1024x1024.png" alt="Logo">' +
                '</div>' +
                '<div class="progress-percentage-large" id="progressPercentage">0%</div>' +
                '<div class="progress-bar-container">' +
                    '<div class="progress-bar-fill" id="progressBarFill"></div>' +
                '</div>' +
                '<div class="progress-steps" id="progressSteps">' +
                    stepsHtml +
                '</div>' +
            '</div>';
    }
    
    if (overlay) overlay.style.display = 'flex';
}

// Hide progress modal
function hideProgressModal() {
    var overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

// Calculate progress percentage based on completed steps
function calculateProgress() {
    if (ProgressState.totalSteps === 0) return 0;
    
    var totalWeight = 0;
    var completedWeight = 0;
    
    ProgressState.steps.forEach(function(step) {
        totalWeight += step.weight;
        var stepEl = document.querySelector('.step[data-step="' + step.id + '"]');
        if (stepEl) {
            if (stepEl.classList.contains('completed')) {
                completedWeight += step.weight;
            } else if (stepEl.classList.contains('active')) {
                completedWeight += step.weight * 0.4; // 40% while running
            }
        }
    });
    
    return Math.round((completedWeight / totalWeight) * 100);
}

// Update progress bar and percentage display
function updateProgressUI() {
    var percentage = calculateProgress();
    var bar = document.getElementById('progressBarFill');
    var pct = document.getElementById('progressPercentage');
    
    if (bar) bar.style.width = percentage + '%';
    if (pct) pct.textContent = percentage + '%';
}

// Activate a step - shows spinner (running state)
function activateStep(stepId) {
    ProgressState.currentStepId = stepId;
    var stepEl = document.querySelector('.step[data-step="' + stepId + '"]');
    
    if (stepEl && !stepEl.classList.contains('completed')) {
        // Update icon to spinner
        var icon = stepEl.querySelector('.step-icon');
        if (icon) icon.textContent = '◌';
        
        stepEl.classList.add('active');
        updateProgressUI();
    }
}

// Mark step as complete - turns GREEN with checkmark ✓
function markStepComplete(stepId) {
    var stepEl = document.querySelector('.step[data-step="' + stepId + '"]');
    
    if (stepEl) {
        stepEl.classList.remove('active');
        stepEl.classList.add('completed');
        
        // Change icon to checkmark
        var icon = stepEl.querySelector('.step-icon');
        if (icon) icon.textContent = '✓';
        
        ProgressState.completedCount++;
        updateProgressUI();
    }
}

// Mark step as failed - turns RED with X
function markStepFailed(stepId, errorMessage) {
    var stepEl = document.querySelector('.step[data-step="' + stepId + '"]');
    
    if (stepEl) {
        stepEl.classList.remove('active');
        stepEl.classList.add('failed');
        
        // Change icon to X
        var icon = stepEl.querySelector('.step-icon');
        if (icon) icon.textContent = '✗';
    }
    
    ProgressState.hasError = true;
}

// Legacy compatibility functions
function updateProgress(step, percentage, status) {
    activateStep(step);
}

function completeStep(step) {
    markStepComplete(step);
}

function failStep(step, errorMessage) {
    markStepFailed(step, errorMessage);
}

function completeAllSteps() {
    ProgressState.steps.forEach(function(step) {
        markStepComplete(step.id);
    });
    
    var bar = document.getElementById('progressBarFill');
    var pct = document.getElementById('progressPercentage');
    
    if (bar) {
        bar.style.width = '100%';
        bar.classList.add('complete');
    }
    if (pct) pct.textContent = '100%';
}

// ==========================================
// Results Display
// ==========================================
function displayResults(data) {
    var resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Decision badge with translation
    var badge = document.getElementById('decisionBadge');
    if (badge) {
        // Translate the decision text based on current language
        var decisionText = data.decision;
        if (data.decision === 'ACCEPT') {
            decisionText = I18n.t('decision.accept');
            badge.className = 'decision-badge accept';
        } else if (data.decision.indexOf('CONDITIONAL') >= 0) {
            decisionText = I18n.t('decision.conditional');
            badge.className = 'decision-badge conditional';
        } else {
            decisionText = I18n.t('decision.reject');
            badge.className = 'decision-badge reject';
        }
        badge.textContent = decisionText;
    }
    
    // Animate scores with actual values from analysis
    animateScore('colorScore', 'colorBar', data.color_score || 0);
    animateScore('patternScore', 'patternBar', data.pattern_score || 0);
    animateScore('overallScore', 'overallBar', data.overall_score || 0);
    
    // Enable download buttons
    var btnDownload = document.getElementById('btnDownload');
    if (btnDownload) btnDownload.disabled = false;
    
    var btnDownloadSettings = document.getElementById('btnDownloadSettings');
    if (btnDownloadSettings) btnDownloadSettings.disabled = false;
}

function animateScore(valueId, barId, score) {
    var valueEl = document.getElementById(valueId);
    var barEl = document.getElementById(barId);
    
    if (valueEl) {
        var current = 0;
        var step = Math.max(score / 30, 1);
        var interval = setInterval(function() {
            current += step;
            if (current >= score) {
                current = score;
                clearInterval(interval);
            }
            valueEl.textContent = current.toFixed(1);
        }, 25);
    }
    
    if (barEl) {
        setTimeout(function() {
            barEl.style.width = score + '%';
    barEl.className = 'bar-fill';
            if (score >= 70) barEl.classList.add('success');
            else if (score >= 50) barEl.classList.add('warning');
            else barEl.classList.add('danger');
        }, 100);
    }
}

// ==========================================
// Delete Images
// ==========================================
function deleteImages() {
    if (!confirm(I18n.t('delete.confirm'))) return;
    
    AppState.sessionId = null;
    AppState.refFile = null;
    AppState.testFile = null;
    AppState.pdfFilename = null;
    AppState.settingsPdfFilename = null;
    
    ['ref', 'test'].forEach(function(type) {
        var preview = document.getElementById(type + 'Preview');
        var placeholder = document.getElementById(type + 'Placeholder');
        var infoEmpty = document.getElementById(type + 'InfoEmpty');
        var infoName = document.getElementById(type + 'InfoName');
        var infoDimensions = document.getElementById(type + 'Info');
        var input = document.getElementById(type + 'Input');
        
        if (preview) preview.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        if (infoEmpty) infoEmpty.style.display = '';
        if (infoName) infoName.textContent = '';
        if (infoDimensions) infoDimensions.style.display = 'none';
        if (input) input.value = '';
    });
    
    var resultsSection = document.getElementById('resultsSection');
    if (resultsSection) resultsSection.style.display = 'none';
    
    ['colorScore', 'patternScore', 'overallScore'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = '--';
    });
    
    ['colorBar', 'patternBar', 'overallBar'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.width = '0%';
    });
    
    var btnDownload = document.getElementById('btnDownload');
    if (btnDownload) btnDownload.disabled = true;
    
    // Reset region selector
    if (typeof RegionSelector !== 'undefined') {
        RegionSelector.reset();
    }
    
    updateButtonStates();
}

// ==========================================
// Downloads
// ==========================================
function downloadReport() {
    if (AppState.sessionId && AppState.pdfFilename) {
        window.open('/api/download/' + AppState.sessionId + '/' + AppState.pdfFilename, '_blank');
    }
}

function downloadSettings() {
    // Download the settings PDF report from the server
    if (AppState.sessionId && AppState.settingsPdfFilename) {
        window.open('/api/download/' + AppState.sessionId + '/' + AppState.settingsPdfFilename, '_blank');
    } else {
        // Fallback: download settings as JSON
        var settings = collectSettings();
        var blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'textile_qc_settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// ==========================================
// Modal
// ==========================================
function initModal() {
    var closeBtn = document.getElementById('closeModal');
    var cancelBtn = document.getElementById('btnCancelSettings');
    var applyBtn = document.getElementById('btnApplySettings');
    var resetBtn = document.getElementById('btnResetSettings');
    var overlay = document.getElementById('settingsModal');
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (applyBtn) applyBtn.addEventListener('click', function() {
        AppState.settings = collectSettings();
        closeModal();
    });
    if (resetBtn) resetBtn.addEventListener('click', loadDefaultSettings);
    
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });
    }
    
    var tabs = document.querySelectorAll('.modal-tabs .tab');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'));
        });
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
    
    // Initialize report language selector
    initReportLanguageSelector();
}

function openModal() {
    var modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    var modal = document.getElementById('settingsModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}

function switchTab(tabName) {
    document.querySelectorAll('.modal-tabs .tab').forEach(function(tab) {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(function(content) {
        content.classList.toggle('active', content.id === 'tab-' + tabName);
    });
}

// ==========================================
// Report Language Selector
// ==========================================
function initReportLanguageSelector() {
    var langEnBtn = document.getElementById('reportLangEn');
    var langTrBtn = document.getElementById('reportLangTr');
    var hiddenInput = document.getElementById('report_language');
    
    if (!langEnBtn || !langTrBtn || !hiddenInput) return;
    
    // Set initial state based on website language
    var currentLang = typeof I18n !== 'undefined' ? I18n.getLanguage() : 'en';
    setReportLanguage(currentLang);
    
    langEnBtn.addEventListener('click', function() {
        setReportLanguage('en');
    });
    
    langTrBtn.addEventListener('click', function() {
        setReportLanguage('tr');
    });
}

function setReportLanguage(lang) {
    var langEnBtn = document.getElementById('reportLangEn');
    var langTrBtn = document.getElementById('reportLangTr');
    var hiddenInput = document.getElementById('report_language');
    
    if (!langEnBtn || !langTrBtn || !hiddenInput) return;
    
    hiddenInput.value = lang;
    
    langEnBtn.classList.toggle('active', lang === 'en');
    langTrBtn.classList.toggle('active', lang === 'tr');
    
    // Store in AppState
    if (typeof AppState !== 'undefined') {
        AppState.reportLanguage = lang;
    }
}

function getReportLanguage() {
    var hiddenInput = document.getElementById('report_language');
    if (hiddenInput) return hiddenInput.value;
    if (typeof AppState !== 'undefined' && AppState.reportLanguage) return AppState.reportLanguage;
    return typeof I18n !== 'undefined' ? I18n.getLanguage() : 'en';
}

// ==========================================
// Settings
// ==========================================
function collectSettings() {
    // Get sampling mode from radio buttons
    var samplingModeRadio = document.querySelector('input[name="sampling_mode"]:checked');
    var samplingMode = samplingModeRadio ? samplingModeRadio.value : 'random';
    
    return {
        // General Settings
        operator_name: getVal('operator_name', 'Operator'),
        timezone_offset_hours: getNum('timezone_offset', 3),
        num_sample_points: getNum('num_sample_points', 5),
        color_score_multiplier: getNum('color_score_multiplier', 20),
        uniformity_std_multiplier: getNum('uniformity_std_multiplier', 10),
        
        // Sampling Settings (for Color Analysis only)
        sampling_mode: samplingMode,
        use_manual_sampling: samplingMode === 'manual' && AppState.manualSamplePoints.length > 0,
        manual_sample_points: samplingMode === 'manual' ? AppState.manualSamplePoints : [],
        
        // Color Thresholds
        delta_e_threshold: getNum('delta_e_threshold', 2.0),
        delta_e_conditional: getNum('delta_e_conditional', 3.5),
        lab_l_threshold: getNum('lab_l_threshold', 1.0),
        lab_ab_threshold: getNum('lab_ab_threshold', 1.0),
        
        // Pattern Thresholds
        ssim_pass_threshold: getNum('ssim_pass_threshold', 0.95),
        ssim_conditional_threshold: getNum('ssim_conditional_threshold', 0.90),
        
        // Score Thresholds
        color_score_threshold: getNum('color_score_threshold', 70),
        pattern_score_threshold: getNum('pattern_score_threshold', 90),
        overall_score_threshold: getNum('overall_score_threshold', 70),
        
        // Color Analysis Settings
        use_delta_e_cmc: getCheck('use_delta_e_cmc', true),
        cmc_l_c_ratio: getVal('cmc_l_c_ratio', '2:1'),
        observer_angle: getVal('observer_angle', '2'),
        geometry_mode: getVal('geometry_mode', 'd/8 SCI'),
        whiteness_min: getNum('whiteness_min', 40),
        yellowness_max: getNum('yellowness_max', 10),
        
        // Pattern Analysis Settings
        lbp_points: getNum('lbp_points', 24),
        lbp_radius: getNum('lbp_radius', 3),
        wavelet_type: getVal('wavelet_type', 'db4'),
        wavelet_levels: getNum('wavelet_levels', 3),
        keypoint_detector: getVal('keypoint_detector', 'ORB'),
        pattern_min_area: getNum('pattern_min_area', 100),
        pattern_max_area: getNum('pattern_max_area', 5000),
        pattern_similarity_threshold: getNum('pattern_similarity_threshold', 0.85),
        defect_min_area: getNum('defect_min_area', 50),
        saliency_strength: getNum('saliency_strength', 1.0),
        
        // Report Sections - Main
        enable_color_unit: getCheck('enable_color_unit', true),
        enable_pattern_unit: getCheck('enable_pattern_unit', true),
        enable_pattern_repetition: getCheck('enable_pattern_repetition', true),
        enable_spectrophotometer: getCheck('enable_spectrophotometer', true),
        enable_analysis_settings: getCheck('enable_analysis_settings', false),
        
        // Report Sections - Color Sub-sections
        enable_color_measurements: getCheck('enable_color_measurements', true),
        enable_color_difference: getCheck('enable_color_difference', true),
        enable_color_statistical: getCheck('enable_color_statistical', true),
        enable_color_visual_diff: getCheck('enable_color_visual_diff', true),
        enable_color_lab_detailed: getCheck('enable_color_lab_detailed', true),
        enable_color_recommendations: getCheck('enable_color_recommendations', true),
        
        // Report Sections - Pattern Sub-sections
        enable_pattern_ssim: getCheck('enable_pattern_ssim', true),
        enable_pattern_symmetry: getCheck('enable_pattern_symmetry', true),
        enable_pattern_edge: getCheck('enable_pattern_edge', true),
        enable_pattern_advanced: getCheck('enable_pattern_advanced', true),
        
        // Language - use the report language selector value
        language: getReportLanguage()
    };
}

function getNum(id, def) { var el = document.getElementById(id); return el ? (parseFloat(el.value) || def) : def; }
function getCheck(id, def) { var el = document.getElementById(id); return el ? el.checked : def; }
function getVal(id, def) { var el = document.getElementById(id); return el ? el.value : def; }

function loadDefaultSettings() {
    fetch('/api/settings/default')
        .then(function(r) { return r.json(); })
        .then(function(defaults) {
            Object.keys(defaults).forEach(function(key) {
                var el = document.getElementById(key);
                if (el) {
                    if (el.type === 'checkbox') el.checked = defaults[key];
                    else el.value = defaults[key];
                }
            });
            AppState.settings = defaults;
        })
        .catch(function(e) { console.error('Settings error:', e); });
}

// ==========================================
// Code Download Feature
// ==========================================
function getHelpContent(type) {
    if (type === 'py') {
        return {
            title: I18n.t('python.script'),
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
            body: `
                <h4>📄 ` + I18n.t('what.is.python') + `</h4>
                <p>` + I18n.t('python.script.desc') + `</p>
                <ul>
                    <li>` + I18n.t('python.works.with') + `</li>
                    <li>` + I18n.t('python.run.directly') + `</li>
                    <li>` + I18n.t('python.ideal.for') + `</li>
                    <li>` + I18n.t('python.can.import') + `</li>
                </ul>
                <div class="highlight-box">
                    <p>💡 ` + I18n.t('best.for') + ` ` + I18n.t('python.best.for') + `</p>
                </div>
            `
        };
    } else if (type === 'ipynb') {
        return {
            title: I18n.t('jupyter.notebook'),
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
            body: `
                <h4>📓 ` + I18n.t('what.is.notebook') + `</h4>
                <p>` + I18n.t('notebook.desc') + `</p>
                <ul>
                    <li>` + I18n.t('notebook.runs.colab') + `</li>
                    <li>` + I18n.t('notebook.interactive') + `</li>
                    <li>` + I18n.t('notebook.easy.modify') + `</li>
                    <li>` + I18n.t('notebook.visualizations') + `</li>
                </ul>
                <div class="highlight-box">
                    <p>☁️ ` + I18n.t('best.for') + ` ` + I18n.t('notebook.best.for') + `</p>
                </div>
            `
        };
    } else if (type === 'github') {
        return {
            title: I18n.t('github.browse.project'),
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>',
            body: `
                <div class="github-help-content">
                    <h4>🔗 ` + I18n.t('github.browse.project') + `</h4>
                    <p class="github-description">` + I18n.t('github.description') + `</p>
                    
                    <div class="github-info-box">
                        <div class="github-info-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; flex-shrink: 0;">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            <span>` + I18n.t('github.read.readme') + `</span>
                        </div>
                        <div class="github-info-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; flex-shrink: 0;">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>` + I18n.t('github.under.construction') + `</span>
                        </div>
                    </div>
                    
                    <div class="github-contact-section">
                        <h5>` + I18n.t('github.inquiries.title') + `</h5>
                        <div class="github-contact-methods">
                            <div class="github-contact-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; flex-shrink: 0;">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <span>` + I18n.t('github.feedback.panel') + `</span>
                            </div>
                            <div class="github-contact-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; flex-shrink: 0;">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                <a href="mailto:aalgamel23@posta.pau.edu.tr" class="github-email-link">aalgamel23@posta.pau.edu.tr</a>
                            </div>
                        </div>
                    </div>
                </div>
            `
        };
    } else if (type === 'datasheet-en' || type === 'datasheet-tr') {
        return {
            title: I18n.t('datasheet.what.is'),
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
            body: `
                <h4>📋 ` + I18n.t('datasheet.what.is') + `</h4>
                <p>` + I18n.t('datasheet.description') + `</p>
                <ul>
                    <li>` + I18n.t('datasheet.math.foundations') + `</li>
                    <li>` + I18n.t('datasheet.full.concept') + `</li>
                    <li>` + I18n.t('datasheet.report.explanation') + `</li>
                    <li>` + I18n.t('datasheet.images.explanation') + `</li>
                </ul>
            `
        };
    }
    return null;
}

var currentHelpType = null;

function initCodeDownload() {
    var btnCodeDownload = document.getElementById('btnCodeDownload');
    var codeDropdown = document.getElementById('codeDropdown');
    var helpOverlay = document.getElementById('helpDialogOverlay');
    var helpClose = document.getElementById('helpDialogClose');
    var helpDownload = document.getElementById('helpDialogDownload');
    
    if (!btnCodeDownload || !codeDropdown) return;
    
    // Toggle dropdown
    btnCodeDownload.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = codeDropdown.classList.contains('show');
        closeAllDropdowns();
        if (!isOpen) {
            codeDropdown.classList.add('show');
            btnCodeDownload.classList.add('active');
        }
    });
    
    // Handle dropdown item clicks
    var dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            // Don't trigger action if clicking on help button
            if (e.target.closest('.btn-help')) return;
            
            var fileType = item.getAttribute('data-type');
            if (fileType === 'github') {
                // Open GitHub repository in new tab
                window.open('https://github.com/algamel98/SPECTRAMATCH', '_blank');
                closeAllDropdowns();
            } else {
                downloadSourceCode(fileType);
                closeAllDropdowns();
            }
        });
    });
    
    // Handle help button clicks
    var helpButtons = document.querySelectorAll('.btn-help');
    helpButtons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var helpType = btn.getAttribute('data-help');
            showHelpDialog(helpType);
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.code-download-container')) {
            closeAllDropdowns();
        }
    });
    
    // Help dialog close
    if (helpClose) {
        helpClose.addEventListener('click', closeHelpDialog);
    }
    
    if (helpOverlay) {
        helpOverlay.addEventListener('click', function(e) {
            if (e.target === helpOverlay) closeHelpDialog();
        });
    }
    
    // Help dialog download button
    if (helpDownload) {
        helpDownload.addEventListener('click', function() {
            if (currentHelpType) {
                if (currentHelpType === 'datasheet-en' || currentHelpType === 'datasheet-tr') {
                    var lang = currentHelpType === 'datasheet-en' ? 'en' : 'tr';
                    downloadDatasheet(lang);
                } else {
                    downloadSourceCode(currentHelpType);
                }
                closeHelpDialog();
            }
        });
    }
    
    // Escape key closes dialogs
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllDropdowns();
            closeHelpDialog();
        }
    });
}

function initDatasheetDownload() {
    var btnDatasheetDownload = document.getElementById('btnDatasheetDownload');
    var datasheetDropdown = document.getElementById('datasheetDropdown');
    var helpOverlay = document.getElementById('helpDialogOverlay');
    
    if (!btnDatasheetDownload || !datasheetDropdown) return;
    
    // Toggle dropdown
    btnDatasheetDownload.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = datasheetDropdown.classList.contains('show');
        closeAllDropdowns();
        if (!isOpen) {
            datasheetDropdown.classList.add('show');
            btnDatasheetDownload.classList.add('active');
        }
    });
    
    // Handle dropdown item clicks (only datasheet items)
    var datasheetItems = datasheetDropdown.querySelectorAll('.dropdown-item');
    datasheetItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            // Don't trigger download if clicking on help button
            if (e.target.closest('.btn-help')) return;
            
            var datasheetType = item.getAttribute('data-type');
            downloadDatasheet(datasheetType);
            closeAllDropdowns();
        });
    });
    
    // Handle help button clicks for datasheet
    var datasheetHelpButtons = datasheetDropdown.querySelectorAll('.btn-help');
    datasheetHelpButtons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var helpType = btn.getAttribute('data-help');
            showHelpDialog(helpType);
        });
    });
}

function downloadDatasheet(lang) {
    var downloadUrl = '/api/download/datasheet/' + lang;
    
    var a = document.createElement('a');
    a.href = downloadUrl;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function closeAllDropdowns() {
    var codeDropdown = document.getElementById('codeDropdown');
    var codeBtn = document.getElementById('btnCodeDownload');
    var datasheetDropdown = document.getElementById('datasheetDropdown');
    var datasheetBtn = document.getElementById('btnDatasheetDownload');
    
    if (codeDropdown) codeDropdown.classList.remove('show');
    if (codeBtn) codeBtn.classList.remove('active');
    if (datasheetDropdown) datasheetDropdown.classList.remove('show');
    if (datasheetBtn) datasheetBtn.classList.remove('active');
}

function showHelpDialog(type) {
    var overlay = document.getElementById('helpDialogOverlay');
    var iconEl = document.getElementById('helpDialogIcon');
    var titleEl = document.getElementById('helpDialogTitle');
    var bodyEl = document.getElementById('helpDialogBody');
    var downloadBtn = document.getElementById('helpDialogDownload');
    
    if (!overlay) return;
    
    var content = getHelpContent(type);
    if (!content) return;
    
    currentHelpType = type;
    
    iconEl.innerHTML = content.icon;
    
    // Update title based on content type
    if (titleEl) {
        if (type === 'datasheet-en' || type === 'datasheet-tr') {
            titleEl.textContent = I18n.t('datasheet.what.is');
        } else {
            titleEl.textContent = I18n.t('format.information');
        }
    }
    
    // Update body content
    bodyEl.innerHTML = content.body;
    
    // Update download button text and behavior based on content type
    if (downloadBtn) {
        var btnSpan = downloadBtn.querySelector('span[data-i18n]');
        var btnSvg = downloadBtn.querySelector('svg');
        
        if (type === 'github') {
            // For GitHub, change button to "Visit GitHub"
            if (btnSpan) {
                btnSpan.textContent = I18n.t('github.visit.repository');
            }
            // Update icon to external link
            if (btnSvg) {
                btnSvg.innerHTML = '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>';
                btnSvg.setAttribute('viewBox', '0 0 24 24');
                btnSvg.setAttribute('fill', 'none');
                btnSvg.setAttribute('stroke', 'currentColor');
                btnSvg.setAttribute('stroke-width', '2');
            }
            // Update button click handler
            downloadBtn.onclick = function(e) {
                e.preventDefault();
                window.open('https://github.com/algamel98/SPECTRAMATCH', '_blank');
                closeHelpDialog();
            };
        } else if (type === 'datasheet-en' || type === 'datasheet-tr') {
            // For datasheet, change button text
            if (btnSpan) {
                btnSpan.textContent = I18n.t('download.datasheet');
            }
            // Reset button click handler
            downloadBtn.onclick = function(e) {
                e.preventDefault();
                if (type === 'datasheet-en') {
                    window.location.href = '/static/docs/datasheet_en.pdf';
                } else if (type === 'datasheet-tr') {
                    window.location.href = '/static/docs/datasheet_tr.pdf';
                }
                closeHelpDialog();
            };
        } else {
            // For source code downloads
            if (btnSpan) {
                btnSpan.textContent = I18n.t('download.this.format');
            }
            // Reset button click handler
            downloadBtn.onclick = function(e) {
                e.preventDefault();
                downloadSourceCode(type);
                closeHelpDialog();
            };
        }
    }
    
    overlay.style.display = 'flex';
    closeAllDropdowns();
}

function closeHelpDialog() {
    var overlay = document.getElementById('helpDialogOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    currentHelpType = null;
}

function downloadSourceCode(fileType) {
    // Handle GitHub case - redirect to GitHub repository
    if (fileType === 'github') {
        window.open('https://github.com/algamel98/SPECTRAMATCH', '_blank');
        return;
    }
    
    var downloadUrl = '/api/source/' + fileType;
    
    // Create a temporary link and trigger download
    var a = document.createElement('a');
    a.href = downloadUrl;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ==========================================
// Sample Tests Feature
// ==========================================
var SampleTestState = {
    isActive: false,
    currentSample: null,
    samples: []
};

function initSampleTests() {
    var toggleBtn = document.getElementById('samplesToggleBtn');
    var sidebar = document.getElementById('samplesSidebar');
    var overlay = document.getElementById('samplesOverlay');
    var closeBtn = document.getElementById('samplesSidebarClose');
    
    if (!toggleBtn || !sidebar) return;
    
    // Toggle sidebar
    toggleBtn.addEventListener('click', function() {
        openSamplesSidebar();
    });
    
    // Close sidebar
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSamplesSidebar);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeSamplesSidebar);
    }
    
    // Escape key closes sidebar
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSamplesSidebar();
        }
    });
    
    // Load samples on first open
    loadSamples();
}

function openSamplesSidebar() {
    var sidebar = document.getElementById('samplesSidebar');
    var overlay = document.getElementById('samplesOverlay');
    
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Update language note
    updateSamplesLanguageNote();
}

function closeSamplesSidebar() {
    var sidebar = document.getElementById('samplesSidebar');
    var overlay = document.getElementById('samplesOverlay');
    
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
}

function updateSamplesLanguageNote() {
    var noteEl = document.getElementById('samplesLanguageNote');
    if (!noteEl) return;
    
    var currentLang = I18n.getLanguage();
    var noteKey = currentLang === 'en' ? 'samples.language.note.en' : 'samples.language.note.tr';
    noteEl.textContent = I18n.t(noteKey);
}

function loadSamples() {
    fetch('/api/samples/list')
        .then(function(response) { return response.json(); })
        .then(function(samples) {
            SampleTestState.samples = samples;
            renderSampleCards(samples);
        })
        .catch(function(error) {
            console.error('Error loading samples:', error);
            var body = document.getElementById('samplesSidebarBody');
            if (body) {
                body.innerHTML = '<div class="samples-loading"><span>' + I18n.t('failed.to.load.samples') + '</span></div>';
            }
        });
}

function renderSampleCards(samples) {
    var body = document.getElementById('samplesSidebarBody');
    if (!body) return;
    
    var html = '';
    samples.forEach(function(sample) {
        html += `
            <div class="sample-card" data-sample-id="${sample.id}">
                <div class="sample-card-header">
                    <div class="sample-card-number">${sample.id}</div>
                    <div class="sample-card-badge">` + I18n.t('ready') + `</div>
                </div>
                <div class="sample-card-images">
                    <div class="sample-card-image-wrapper">
                        <span class="sample-card-image-label">` + I18n.t('ref.label') + `</span>
                        <img src="/api/samples/image/${sample.reference}" alt="Reference" class="sample-card-image">
                    </div>
                    <div class="sample-card-image-wrapper">
                        <span class="sample-card-image-label">` + I18n.t('sample.label') + `</span>
                        <img src="/api/samples/image/${sample.sample}" alt="Sample" class="sample-card-image">
                    </div>
                </div>
                <button class="sample-card-btn" data-sample-id="${sample.id}" type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    ` + I18n.t('run') + ` ${sample.name}
                </button>
            </div>
        `;
    });
    
    body.innerHTML = html;
    
    // Attach click handlers
    var buttons = body.querySelectorAll('.sample-card-btn');
    buttons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var sampleId = parseInt(btn.getAttribute('data-sample-id'));
            runSampleTest(sampleId);
        });
    });
}

function runSampleTest(sampleId) {
    var sample = SampleTestState.samples.find(function(s) { return s.id === sampleId; });
    if (!sample) return;
    
    SampleTestState.isActive = true;
    SampleTestState.currentSample = sample;
    
    // Close sidebar
    closeSamplesSidebar();
    
    // Load images into the viewer
    loadSampleImages(sample);
    
    // Start simulated processing after a short delay
    setTimeout(function() {
        runSimulatedProcessing(sample);
    }, 500);
}

function loadSampleImages(sample) {
    // Helper function to truncate filename
    function truncateName(name, maxLen) {
        if (name.length > maxLen) {
            return name.substring(0, maxLen - 3) + '...';
        }
        return name;
    }
    
    // Load reference image
    var refPreview = document.getElementById('refPreview');
    var refPlaceholder = document.getElementById('refPlaceholder');
    var refInfoEmpty = document.getElementById('refInfoEmpty');
    var refInfoName = document.getElementById('refInfoName');
    var refInfo = document.getElementById('refInfo');
    
    if (refPreview && refPlaceholder) {
        refPreview.src = '/api/samples/image/' + sample.reference;
        refPreview.onload = function() {
            refPreview.style.display = 'block';
            refPlaceholder.style.display = 'none';
            if (refInfo) {
                refInfo.textContent = refPreview.naturalWidth + '×' + refPreview.naturalHeight;
                refInfo.style.display = 'inline-block';
            }
            if (refInfoName) {
                refInfoName.textContent = truncateName(sample.reference, 20);
                refInfoName.title = sample.reference;
            }
            if (refInfoEmpty) refInfoEmpty.style.display = 'none';
        };
    }
    
    // Load sample image
    var testPreview = document.getElementById('testPreview');
    var testPlaceholder = document.getElementById('testPlaceholder');
    var testInfoEmpty = document.getElementById('testInfoEmpty');
    var testInfoName = document.getElementById('testInfoName');
    var testInfo = document.getElementById('testInfo');
    
    if (testPreview && testPlaceholder) {
        testPreview.src = '/api/samples/image/' + sample.sample;
        testPreview.onload = function() {
            testPreview.style.display = 'block';
            testPlaceholder.style.display = 'none';
            if (testInfo) {
                testInfo.textContent = testPreview.naturalWidth + '×' + testPreview.naturalHeight;
                testInfo.style.display = 'inline-block';
            }
            if (testInfoName) {
                testInfoName.textContent = truncateName(sample.sample, 20);
                testInfoName.title = sample.sample;
            }
            if (testInfoEmpty) testInfoEmpty.style.display = 'none';
        };
    }
}

function runSimulatedProcessing(sample) {
    // Show progress modal
    showSampleProgressModal();
    
    // Simulated progress steps
    var steps = [
        { step: 'upload', progress: 10, status: I18n.t('uploading.images'), delay: 300 },
        { step: 'color', progress: 35, status: I18n.t('analyzing.colors'), delay: 600 },
        { step: 'pattern', progress: 60, status: I18n.t('analyzing.patterns'), delay: 600 },
        { step: 'repetition', progress: 80, status: I18n.t('analyzing.repetition'), delay: 500 },
        { step: 'scoring', progress: 90, status: I18n.t('calculating.scores'), delay: 400 },
        { step: 'report', progress: 100, status: I18n.t('load.report'), delay: 300 }
    ];
    
    var currentStep = 0;
    
    function processNextStep() {
        if (currentStep >= steps.length) {
            // Complete - show results
            setTimeout(function() {
                hideProgressModal();
                displaySampleResults(sample);
            }, 500);
            return;
        }
        
        var stepData = steps[currentStep];
        updateSampleProgress(stepData.step, stepData.progress, stepData.status);
        
        // Mark previous steps as completed
        for (var i = 0; i < currentStep; i++) {
            completeSampleStep(steps[i].step);
        }
        
        currentStep++;
        setTimeout(processNextStep, stepData.delay);
    }
    
    processNextStep();
}

function showSampleProgressModal() {
    var overlay = document.getElementById('loadingOverlay');
    var content = document.querySelector('.loading-content');
    
    // Sample tests always show all steps
    var sampleSteps = [
        { id: 'upload', label: I18n.t('load.images') },
        { id: 'color', label: I18n.t('color.analysis.step') },
        { id: 'pattern', label: I18n.t('pattern.analysis.step') },
        { id: 'repetition', label: I18n.t('pattern.repetition.step') },
        { id: 'scoring', label: I18n.t('calculate.scores') },
        { id: 'report', label: I18n.t('load.report') }
    ];
    
    var stepsHtml = sampleSteps.map(function(step, index) {
        return '<div class="step" data-step="' + step.id + '" data-index="' + index + '">' +
               '<span class="step-icon-wrapper"><span class="step-icon">○</span></span>' +
               '<span class="step-label">' + step.label + '</span>' +
               '</div>';
    }).join('');
    
    if (content) {
        content.innerHTML = 
            '<div class="progress-modal">' +
                '<div class="progress-logo">' +
                    '<img src="/static/images/logo_square_with_name_1024x1024.png" alt="Logo">' +
                '</div>' +
                '<div class="progress-percentage-large" id="progressPercentage">0%</div>' +
                '<div class="progress-bar-container">' +
                    '<div class="progress-bar-fill" id="progressBarFill"></div>' +
                '</div>' +
                '<div class="progress-steps" id="progressSteps">' +
                    stepsHtml +
                '</div>' +
            '</div>';
    }
    
    if (overlay) overlay.style.display = 'flex';
}

function updateSampleProgress(step, percentage, status) {
    var bar = document.getElementById('progressBarFill');
    var pct = document.getElementById('progressPercentage');
    
    if (bar) bar.style.width = percentage + '%';
    if (pct) pct.textContent = percentage + '%';
    
    // Mark step as active with spinner
    var stepEl = document.querySelector('.step[data-step="' + step + '"]');
    if (stepEl && !stepEl.classList.contains('completed')) {
        // Remove active from other steps
        document.querySelectorAll('.progress-steps .step.active').forEach(function(el) {
            if (el !== stepEl && !el.classList.contains('completed')) {
                el.classList.remove('active');
            }
        });
        
        // Update icon to spinner symbol
        var icon = stepEl.querySelector('.step-icon');
        if (icon) icon.textContent = '◌';
        
        stepEl.classList.add('active');
    }
}

function completeSampleStep(step) {
    var stepEl = document.querySelector('.step[data-step="' + step + '"]');
    if (stepEl) {
        stepEl.classList.remove('active');
        stepEl.classList.add('completed');
        
        // Change icon to green checkmark
        var icon = stepEl.querySelector('.step-icon');
        if (icon) icon.textContent = '✓';
    }
}

function displaySampleResults(sample) {
    var resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Set decision badge based on sample (simulate results) with translation
    var badge = document.getElementById('decisionBadge');
    var decisions = ['ACCEPT', 'CONDITIONAL ACCEPT', 'ACCEPT'];
    var decision = decisions[(sample.id - 1) % decisions.length];
    
    if (badge) {
        var decisionText = decision;
        if (decision === 'ACCEPT') {
            decisionText = I18n.t('decision.accept');
            badge.className = 'decision-badge accept';
        } else if (decision.indexOf('CONDITIONAL') >= 0) {
            decisionText = I18n.t('decision.conditional');
            badge.className = 'decision-badge conditional';
        } else {
            decisionText = I18n.t('decision.reject');
            badge.className = 'decision-badge reject';
        }
        badge.textContent = decisionText;
    }
    
    // Simulate scores based on sample
    var scores = [
        { color: 92.5, pattern: 88.3, overall: 90.4 },
        { color: 78.2, pattern: 82.1, overall: 80.2 },
        { color: 95.1, pattern: 91.7, overall: 93.4 }
    ];
    var scoreSet = scores[(sample.id - 1) % scores.length];
    
    animateScore('colorScore', 'colorBar', scoreSet.color);
    animateScore('patternScore', 'patternBar', scoreSet.pattern);
    animateScore('overallScore', 'overallBar', scoreSet.overall);
    
    // Update download button for sample report
    var btnDownload = document.getElementById('btnDownload');
    if (btnDownload) {
        btnDownload.disabled = false;
        // Remove old event listeners and add new one
        var newBtn = btnDownload.cloneNode(true);
        btnDownload.parentNode.replaceChild(newBtn, btnDownload);
        newBtn.addEventListener('click', function() {
            downloadSampleReport(sample.id);
        });
    }
}

function downloadSampleReport(sampleId) {
    // Get current language and append to URL
    var currentLang = I18n.getLanguage();
    var downloadUrl = '/api/samples/report/' + sampleId + '?lang=' + currentLang;
    
    var a = document.createElement('a');
    a.href = downloadUrl;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ==========================================
// Feedback Sidebar
// ==========================================
function initFeedbackSidebar() {
    var toggleBtn = document.getElementById('feedbackToggleBtn');
    var sidebar = document.getElementById('feedbackSidebar');
    var overlay = document.getElementById('feedbackOverlay');
    var closeBtn = document.getElementById('feedbackSidebarClose');
    var form = document.getElementById('feedbackForm');
    var anonymousToggle = document.getElementById('anonymousToggle');
    var personalFields = document.getElementById('personalFields');
    var messageField = document.getElementById('message');
    var charCount = document.getElementById('charCount');
    var fileInput = document.getElementById('fileUpload');
    var fileName = document.getElementById('fileName');
    var fileSizeError = document.getElementById('fileSizeError');
    
    if (!toggleBtn || !sidebar) return;
    
    // Toggle sidebar
    toggleBtn.addEventListener('click', function() {
        openFeedbackSidebar();
    });
    
    // Close sidebar
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFeedbackSidebar);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeFeedbackSidebar);
    }
    
    // Escape key closes sidebar
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeFeedbackSidebar();
        }
    });
    
    // Anonymous toggle
    if (anonymousToggle && personalFields) {
        anonymousToggle.addEventListener('change', function() {
            if (this.checked) {
                personalFields.classList.add('hidden');
            } else {
                personalFields.classList.remove('hidden');
            }
        });
    }
    
    // Character count for message
    if (messageField && charCount) {
        messageField.addEventListener('input', function() {
            var length = this.value.length;
            charCount.textContent = '(' + length + '/2000)';
            if (length > 2000) {
                charCount.style.color = '#ef4444';
            } else {
                charCount.style.color = '#64748b';
            }
        });
    }
    
    // Form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFeedbackForm();
        });
    }
    
    // Send New Feedback button
    var btnFeedbackNew = document.getElementById('btnFeedbackNew');
    if (btnFeedbackNew) {
        btnFeedbackNew.addEventListener('click', function() {
            resetFeedbackForm();
        });
    }
}

function resetFeedbackForm() {
    var form = document.getElementById('feedbackForm');
    var formContent = document.getElementById('feedbackFormContent');
    var successMessage = document.getElementById('feedbackSuccessMessage');
    
    if (form) {
        form.reset();
    }
    
    if (document.getElementById('anonymousToggle')) {
        document.getElementById('anonymousToggle').checked = false;
    }
    
    if (document.getElementById('personalFields')) {
        document.getElementById('personalFields').classList.remove('hidden');
    }
    
    if (document.getElementById('charCount')) {
        document.getElementById('charCount').textContent = '(0/2000)';
    }
    
    if (document.getElementById('messageError')) {
        document.getElementById('messageError').style.display = 'none';
    }
    
    if (document.getElementById('message')) {
        document.getElementById('message').classList.remove('error');
    }
    
    if (formContent) {
        formContent.classList.remove('hidden');
    }
    
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

function openFeedbackSidebar() {
    var sidebar = document.getElementById('feedbackSidebar');
    var overlay = document.getElementById('feedbackOverlay');
    
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeFeedbackSidebar() {
    var sidebar = document.getElementById('feedbackSidebar');
    var overlay = document.getElementById('feedbackOverlay');
    
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function submitFeedbackForm() {
    var form = document.getElementById('feedbackForm');
    var formContent = document.getElementById('feedbackFormContent');
    var successMessage = document.getElementById('feedbackSuccessMessage');
    var messageField = document.getElementById('message');
    var messageError = document.getElementById('messageError');
    var submitBtn = document.getElementById('feedbackSubmitBtn');
    
    // Reset errors
    if (messageError) {
        messageError.style.display = 'none';
        messageError.textContent = '';
    }
    
    if (messageField) {
        messageField.classList.remove('error');
    }
    
    // Validate message
    var message = messageField ? messageField.value.trim() : '';
    if (!message) {
        if (messageField) {
            messageField.classList.add('error');
            messageField.focus();
        }
        if (messageError) {
            messageError.textContent = I18n.t('message.required');
            messageError.style.display = 'block';
        }
        return;
    }
    
    // Disable submit button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>' + I18n.t('sending') + '...</span>';
    }
    
    // Prepare form data
    var formData = new FormData();
    formData.append('access_key', '5176da08-b0a1-4245-8fb0-4fbf75e8e6d0');
    formData.append('subject', 'Feedback Submission - ' + (document.getElementById('feedbackType') ? document.getElementById('feedbackType').options[document.getElementById('feedbackType').selectedIndex].text : 'Feedback'));
    
    // Build email body
    var emailBody = '';
    var anonymous = document.getElementById('anonymousToggle') ? document.getElementById('anonymousToggle').checked : false;
    
    if (!anonymous) {
        var firstName = document.getElementById('firstName') ? document.getElementById('firstName').value.trim() : '';
        var lastName = document.getElementById('lastName') ? document.getElementById('lastName').value.trim() : '';
        var email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
        var phone = document.getElementById('phone') ? document.getElementById('phone').value.trim() : '';
        
        if (firstName) emailBody += 'First Name: ' + firstName + '\n';
        if (lastName) emailBody += 'Last Name: ' + lastName + '\n';
        if (email) emailBody += 'Email: ' + email + '\n';
        if (phone) emailBody += 'Phone: ' + phone + '\n';
        emailBody += '\n';
    } else {
        emailBody += 'Submitted anonymously\n\n';
    }
    
    var feedbackType = document.getElementById('feedbackType') ? document.getElementById('feedbackType').options[document.getElementById('feedbackType').selectedIndex].text : '';
    emailBody += 'Feedback Type: ' + feedbackType + '\n';
    emailBody += 'Message:\n' + message + '\n';
    
    formData.append('message', emailBody);
    formData.append('from_name', anonymous ? 'Anonymous User' : (document.getElementById('firstName') && document.getElementById('firstName').value.trim() ? document.getElementById('firstName').value.trim() : 'Feedback User'));
    formData.append('email', document.getElementById('email') && document.getElementById('email').value.trim() ? document.getElementById('email').value.trim() : 'noreply@textileqc.com');
    
    // Submit to Web3Forms
    fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        if (data.success) {
            // Hide form and show success message
            if (formContent) {
                formContent.classList.add('hidden');
            }
            if (successMessage) {
                successMessage.style.display = 'flex';
            }
        } else {
            throw new Error(data.message || 'Submission failed');
        }
    })
    .catch(function(error) {
        console.error('Feedback submission error:', error);
        // Show error in form
        if (messageError) {
            messageError.textContent = I18n.t('feedback.error') + ': ' + error.message;
            messageError.style.display = 'block';
        }
    })
    .finally(function() {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg><span>' + I18n.t('send') + '</span>';
        }
    });
}

function updateFeedbackFormTranslations() {
    // Update select options
    var feedbackType = document.getElementById('feedbackType');
    if (feedbackType) {
        var options = feedbackType.querySelectorAll('option');
        options.forEach(function(option) {
            var value = option.getAttribute('value');
            if (value) {
                var key = 'feedback.type.' + value;
                option.textContent = I18n.t(key);
            }
        });
    }
}

// ==========================================
// Contact Popup
// ==========================================
function initContactPopup() {
    var footerContactBtn = document.getElementById('footerContactBtn');
    var contactPopup = document.getElementById('contactPopup');
    var contactPopupClose = document.getElementById('contactPopupClose');
    
    if (!footerContactBtn || !contactPopup) return;
    
    // Open popup on button click
    footerContactBtn.addEventListener('click', function() {
        contactPopup.style.display = 'flex';
    });
    
    // Close button
    if (contactPopupClose) {
        contactPopupClose.addEventListener('click', function() {
            contactPopup.style.display = 'none';
        });
    }
    
    // Close on overlay click
    contactPopup.addEventListener('click', function(e) {
        if (e.target === contactPopup) {
            contactPopup.style.display = 'none';
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && contactPopup.style.display === 'flex') {
            contactPopup.style.display = 'none';
        }
    });
}

// ==========================================
// Manual Point Selection for Color Analysis
// ==========================================
var PointSelectorState = {
    isOpen: false,
    points: [],
    targetCount: 5,
    refImageData: null,
    sampleImageData: null,
    refCanvas: null,
    sampleCanvas: null,
    refCtx: null,
    sampleCtx: null,
    imageScale: { x: 1, y: 1 },
    roi: null
};

function initSamplingModeSelector() {
    var radioButtons = document.querySelectorAll('input[name="sampling_mode"]');
    var manualPointsRow = document.getElementById('manualPointsRow');
    
    radioButtons.forEach(function(radio) {
        radio.addEventListener('change', function() {
            AppState.samplingMode = this.value;
            
            if (this.value === 'manual') {
                if (manualPointsRow) manualPointsRow.style.display = 'flex';
            } else {
                if (manualPointsRow) manualPointsRow.style.display = 'none';
                // Clear manual points when switching to random
                clearManualPoints();
            }
        });
    });
}

function initPointSelectorModal() {
    var modal = document.getElementById('pointSelectorModal');
    var closeBtn = document.getElementById('closePointSelector');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closePointSelector);
    }
    
    // Close on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && PointSelectorState.isOpen) {
            closePointSelector();
        }
    });
    
    // Close on overlay click
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closePointSelector();
            }
        });
    }
}

function openPointSelector() {
    // Check if color analysis is enabled
    var colorEnabled = document.getElementById('enable_color_unit');
    if (colorEnabled && !colorEnabled.checked) {
        alert(I18n.t('color.analysis.disabled.hint') || 'Color Analysis must be enabled to select sample points.');
        return;
    }
    
    // Check if images are uploaded
    if (!AppState.refFile || !AppState.testFile) {
        alert(I18n.t('please.upload.both') || 'Please upload both reference and sample images first.');
        return;
    }
    
    var modal = document.getElementById('pointSelectorModal');
    if (!modal) return;
    
    // Get target point count
    var numPointsInput = document.getElementById('num_sample_points');
    PointSelectorState.targetCount = numPointsInput ? parseInt(numPointsInput.value) || 5 : 5;
    PointSelectorState.points = [];
    PointSelectorState.isOpen = true;
    
    // Update counter
    updatePointCounter();
    
    // Load images into modal
    loadImagesIntoPointSelector();
    
    // Get ROI info if enabled
    updatePointSelectorROI();
    
    modal.style.display = 'flex';
}

function closePointSelector() {
    var modal = document.getElementById('pointSelectorModal');
    if (modal) {
        modal.style.display = 'none';
    }
    PointSelectorState.isOpen = false;
}

function loadImagesIntoPointSelector() {
    var refImg = document.getElementById('pointSelectorRefImage');
    var sampleImg = document.getElementById('pointSelectorSampleImage');
    var refCanvas = document.getElementById('pointSelectorRefCanvas');
    var sampleCanvas = document.getElementById('pointSelectorSampleCanvas');
    var refContainer = document.getElementById('pointSelectorRefContainer');
    var sampleContainer = document.getElementById('pointSelectorSampleContainer');
    
    // Load reference image
    if (AppState.refFile && refImg) {
        var refReader = new FileReader();
        refReader.onload = function(e) {
            refImg.src = e.target.result;
            refImg.onload = function() {
                setupPointSelectorCanvas('ref', refImg, refCanvas, refContainer);
            };
        };
        refReader.readAsDataURL(AppState.refFile);
    }
    
    // Load sample image
    if (AppState.testFile && sampleImg) {
        var sampleReader = new FileReader();
        sampleReader.onload = function(e) {
            sampleImg.src = e.target.result;
            sampleImg.onload = function() {
                setupPointSelectorCanvas('sample', sampleImg, sampleCanvas, sampleContainer);
            };
        };
        sampleReader.readAsDataURL(AppState.testFile);
    }
}

function setupPointSelectorCanvas(type, img, canvas, container) {
    if (!canvas || !container) return;
    
    // Get display dimensions
    var displayWidth = container.clientWidth;
    var displayHeight = container.clientHeight;
    
    // Set canvas dimensions to match display
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    
    // Calculate scale factor
    var scaleX = img.naturalWidth / displayWidth;
    var scaleY = img.naturalHeight / displayHeight;
    
    if (type === 'ref') {
        PointSelectorState.refCanvas = canvas;
        PointSelectorState.refCtx = canvas.getContext('2d');
        PointSelectorState.imageScale = { x: scaleX, y: scaleY };
        
        // Add click handler
        container.onclick = function(e) {
            handlePointSelectorClick(e, 'ref');
        };
    } else {
        PointSelectorState.sampleCanvas = canvas;
        PointSelectorState.sampleCtx = canvas.getContext('2d');
        
        // Add click handler
        container.onclick = function(e) {
            handlePointSelectorClick(e, 'sample');
        };
    }
    
    // Redraw existing points
    redrawPointMarkers();
}

function handlePointSelectorClick(e, source) {
    if (PointSelectorState.points.length >= PointSelectorState.targetCount) {
        return; // Already have enough points
    }
    
    var container = e.currentTarget;
    var rect = container.getBoundingClientRect();
    
    // Get click position relative to container
    var clickX = e.clientX - rect.left;
    var clickY = e.clientY - rect.top;
    
    // Check if click is within ROI (if ROI is enabled)
    if (!isPointWithinROI(clickX, clickY, container)) {
        showPointSelectorHint('warning', I18n.t('point.outside.roi') || 'Point must be within the selected region');
        return;
    }
    
    // Convert to normalized coordinates (0-1)
    var normalizedX = clickX / container.clientWidth;
    var normalizedY = clickY / container.clientHeight;
    
    // Add point
    PointSelectorState.points.push({
        x: normalizedX,
        y: normalizedY,
        displayX: clickX,
        displayY: clickY,
        index: PointSelectorState.points.length + 1
    });
    
    // Update UI
    updatePointCounter();
    redrawPointMarkers();
    updatePointSelectorButtons();
    
    // Check if we have all points
    if (PointSelectorState.points.length >= PointSelectorState.targetCount) {
        showPointSelectorHint('success', I18n.t('all.points.selected') || 'All points selected! Click Confirm to save.');
        // Auto-confirm after short delay
        setTimeout(function() {
            confirmPoints();
        }, 800);
    }
}

function isPointWithinROI(x, y, container) {
    // If no ROI or full image mode, allow anywhere
    if (AppState.processFullImage || !AppState.shapeType) {
        return true;
    }
    
    // Check if RegionSelector is active
    if (typeof RegionSelector !== 'undefined' && RegionSelector.isPlaced()) {
        var cropSettings = RegionSelector.getCropSettings();
        if (!cropSettings.use_crop) return true;
        
        // Get container dimensions
        var containerWidth = container.clientWidth;
        var containerHeight = container.clientHeight;
        
        // Get ROI center and dimensions in container space
        // The crop coordinates are in image space, need to convert
        var refImg = document.getElementById('pointSelectorRefImage');
        if (!refImg) return true;
        
        var scaleX = containerWidth / refImg.naturalWidth;
        var scaleY = containerHeight / refImg.naturalHeight;
        
        var centerX = cropSettings.crop_center_x * scaleX;
        var centerY = cropSettings.crop_center_y * scaleY;
        
        if (cropSettings.crop_shape === 'circle') {
            var radius = (cropSettings.crop_diameter / 2) * Math.min(scaleX, scaleY);
            var dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            return dist <= radius;
        } else {
            var halfW = (cropSettings.crop_width / 2) * scaleX;
            var halfH = (cropSettings.crop_height / 2) * scaleY;
            return x >= centerX - halfW && x <= centerX + halfW &&
                   y >= centerY - halfH && y <= centerY + halfH;
        }
    }
    
    return true;
}

function updatePointSelectorROI() {
    var refROI = document.getElementById('pointSelectorRefROI');
    var sampleROI = document.getElementById('pointSelectorSampleROI');
    
    // Clear existing ROI
    if (refROI) refROI.innerHTML = '';
    if (sampleROI) sampleROI.innerHTML = '';
    
    // If full image mode or no region selected, no ROI overlay
    if (AppState.processFullImage) return;
    
    if (typeof RegionSelector !== 'undefined' && RegionSelector.isPlaced()) {
        var cropSettings = RegionSelector.getCropSettings();
        if (!cropSettings.use_crop) return;
        
        // Show ROI on both images
        showROIOverlay(refROI, cropSettings, 'pointSelectorRefImage');
        showROIOverlay(sampleROI, cropSettings, 'pointSelectorSampleImage');
    }
}

function showROIOverlay(roiElement, cropSettings, imgId) {
    if (!roiElement) return;
    
    var img = document.getElementById(imgId);
    var container = roiElement.parentElement;
    if (!img || !container) return;
    
    var containerWidth = container.clientWidth;
    var containerHeight = container.clientHeight;
    
    var scaleX = containerWidth / img.naturalWidth;
    var scaleY = containerHeight / img.naturalHeight;
    
    var centerX = cropSettings.crop_center_x * scaleX;
    var centerY = cropSettings.crop_center_y * scaleY;
    
    // Create clear zone element
    var clearZone = document.createElement('div');
    clearZone.className = 'roi-clear-zone';
    
    if (cropSettings.crop_shape === 'circle') {
        var diameter = cropSettings.crop_diameter * Math.min(scaleX, scaleY);
        clearZone.classList.add('circle');
        clearZone.style.width = diameter + 'px';
        clearZone.style.height = diameter + 'px';
        clearZone.style.left = (centerX - diameter / 2) + 'px';
        clearZone.style.top = (centerY - diameter / 2) + 'px';
    } else {
        var width = cropSettings.crop_width * scaleX;
        var height = cropSettings.crop_height * scaleY;
        clearZone.style.width = width + 'px';
        clearZone.style.height = height + 'px';
        clearZone.style.left = (centerX - width / 2) + 'px';
        clearZone.style.top = (centerY - height / 2) + 'px';
    }
    
    roiElement.appendChild(clearZone);
    roiElement.classList.add('has-roi');
}

function updatePointCounter() {
    var current = document.getElementById('pointCountCurrent');
    var total = document.getElementById('pointCountTotal');
    var progress = document.getElementById('pointProgressFill');
    
    var count = PointSelectorState.points.length;
    var target = PointSelectorState.targetCount;
    
    if (current) current.textContent = count;
    if (total) total.textContent = target;
    if (progress) progress.style.width = (count / target * 100) + '%';
}

function redrawPointMarkers() {
    // Clear both canvases
    if (PointSelectorState.refCtx) {
        PointSelectorState.refCtx.clearRect(0, 0, 
            PointSelectorState.refCanvas.width, 
            PointSelectorState.refCanvas.height);
    }
    if (PointSelectorState.sampleCtx) {
        PointSelectorState.sampleCtx.clearRect(0, 0, 
            PointSelectorState.sampleCanvas.width, 
            PointSelectorState.sampleCanvas.height);
    }
    
    // Draw points on both canvases
    PointSelectorState.points.forEach(function(point) {
        drawPointMarker(PointSelectorState.refCtx, point, 
            PointSelectorState.refCanvas ? PointSelectorState.refCanvas.width : 0,
            PointSelectorState.refCanvas ? PointSelectorState.refCanvas.height : 0);
        drawPointMarker(PointSelectorState.sampleCtx, point,
            PointSelectorState.sampleCanvas ? PointSelectorState.sampleCanvas.width : 0,
            PointSelectorState.sampleCanvas ? PointSelectorState.sampleCanvas.height : 0);
    });
}

function drawPointMarker(ctx, point, canvasWidth, canvasHeight) {
    if (!ctx || !canvasWidth || !canvasHeight) return;
    
    var x = point.x * canvasWidth;
    var y = point.y * canvasHeight;
    var index = point.index;
    
    // Draw outer ring
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 102, 204, 0.3)';
    ctx.fill();
    
    // Draw main circle
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#0066cc';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw number
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(index.toString(), x, y);
    
    // Draw crosshair lines
    ctx.strokeStyle = 'rgba(0, 102, 204, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x - 12, y);
    ctx.moveTo(x + 12, y);
    ctx.lineTo(x + 20, y);
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x, y - 12);
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x, y + 20);
    ctx.stroke();
}

function updatePointSelectorButtons() {
    var undoBtn = document.getElementById('btnUndoPoint');
    var confirmBtn = document.getElementById('btnConfirmPoints');
    
    var hasPoints = PointSelectorState.points.length > 0;
    var hasAllPoints = PointSelectorState.points.length >= PointSelectorState.targetCount;
    
    if (undoBtn) undoBtn.disabled = !hasPoints;
    if (confirmBtn) confirmBtn.disabled = !hasPoints;
}

function showPointSelectorHint(type, message) {
    var hint = document.getElementById('pointSelectorHint');
    if (!hint) return;
    
    hint.className = 'point-selector-hint ' + type;
    var span = hint.querySelector('span');
    if (span) span.textContent = message;
}

function undoLastPoint() {
    if (PointSelectorState.points.length > 0) {
        PointSelectorState.points.pop();
        updatePointCounter();
        redrawPointMarkers();
        updatePointSelectorButtons();
        showPointSelectorHint('', I18n.t('click.anywhere.hint') || 'Click anywhere on either image to place a sample point.');
    }
}

function clearAllPoints() {
    PointSelectorState.points = [];
    updatePointCounter();
    redrawPointMarkers();
    updatePointSelectorButtons();
    showPointSelectorHint('', I18n.t('click.anywhere.hint') || 'Click anywhere on either image to place a sample point.');
}

function confirmPoints() {
    if (PointSelectorState.points.length === 0) return;
    
    // Save points to AppState (normalized coordinates)
    AppState.manualSamplePoints = PointSelectorState.points.map(function(p) {
        return [p.x, p.y];
    });
    
    // Update status display
    updateManualPointsStatus();
    
    // Close modal
    closePointSelector();
}

function updateManualPointsStatus() {
    var statusEl = document.getElementById('manualPointsStatus');
    var statusText = statusEl ? statusEl.querySelector('.status-text') : null;
    var clearBtn = document.getElementById('btnClearPoints');
    
    var count = AppState.manualSamplePoints.length;
    
    if (count > 0) {
        if (statusEl) statusEl.classList.add('has-points');
        if (statusText) {
            statusText.textContent = count + ' ' + (I18n.t('points.selected') || 'points selected');
        }
        if (clearBtn) clearBtn.style.display = 'flex';
    } else {
        if (statusEl) statusEl.classList.remove('has-points');
        if (statusText) {
            statusText.textContent = I18n.t('no.points.selected') || 'No points selected';
        }
        if (clearBtn) clearBtn.style.display = 'none';
    }
}

function clearManualPoints() {
    AppState.manualSamplePoints = [];
    PointSelectorState.points = [];
    updateManualPointsStatus();
}
