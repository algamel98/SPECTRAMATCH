# 🎨 Textile QC System

<div align="center">

**Professional Color & Pattern Analysis for Textile Quality Control**

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success.svg)](https://github.com)

*A comprehensive web-based system for automated textile quality control through advanced image analysis and pattern recognition*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Analysis Capabilities](#-analysis-capabilities)
- [Report Generation](#-report-generation)
- [Internationalization](#-internationalization)
- [Development](#-development)
- [Contributing](#-contributing)
- [Author](#-author)
- [License](#-license)

---

## 🎯 Overview

**Textile QC System** is an advanced, web-based quality control platform designed for the textile industry. It provides comprehensive color and pattern analysis capabilities through state-of-the-art computer vision and image processing techniques. The system enables textile manufacturers, quality assurance teams, and researchers to perform automated quality assessments, generate detailed PDF reports, and maintain consistent quality standards.

### Core Purpose

The system addresses critical quality control challenges in textile manufacturing by:

- **Automating Quality Assessment**: Eliminating subjective visual inspections through quantitative analysis
- **Standardizing Quality Metrics**: Providing consistent, reproducible quality scores based on industry standards
- **Enhancing Production Efficiency**: Rapid analysis and reporting enable faster decision-making
- **Supporting Research & Development**: Advanced analytical tools support textile research and development initiatives

---

## ✨ Key Features

### 🎨 **Color Analysis**
- **Delta E (ΔE) Color Difference**: CIE76, CIE94, and CIEDE2000 color difference calculations
- **LAB Color Space Analysis**: Comprehensive L*, a*, b* channel analysis with statistical metrics
- **Spectral Proxy Analysis**: RGB-to-spectral reflectance estimation for color characterization
- **Color Uniformity Assessment**: Statistical analysis of color distribution and variance
- **Visual Difference Maps**: Heatmap visualizations highlighting color variations
- **Quality Scoring**: Automated color quality scores with pass/fail/conditional thresholds

### 🔍 **Pattern Analysis**
- **Structural Similarity Index (SSIM)**: Multi-scale pattern similarity assessment
- **Symmetry Analysis**: Detection and quantification of pattern symmetry
- **Edge Detection**: Canny edge detection with pattern edge quality metrics
- **Pattern Repetition Detection**: Automated identification and counting of pattern repetitions
- **Template Matching**: Advanced pattern matching using keypoint detection (SIFT, ORB, AKAZE)
- **Spatial Distribution Analysis**: Grid-based pattern distribution assessment

### 🌊 **Advanced Texture Analysis**
- **Fast Fourier Transform (FFT)**: Frequency domain analysis for periodic patterns
- **Gabor Filter Bank**: Multi-scale, multi-orientation texture feature extraction
- **Gray-Level Co-occurrence Matrix (GLCM)**: Statistical texture analysis (contrast, correlation, energy, homogeneity)
- **Local Binary Patterns (LBP)**: Rotation-invariant texture descriptors
- **Wavelet Decomposition**: Multi-resolution texture analysis using PyWavelets
- **Histogram of Oriented Gradients (HOG)**: Gradient-based texture features
- **Structure Tensor Analysis**: Directional texture analysis

### 📊 **Report Generation**
- **Comprehensive PDF Reports**: Professional A4-formatted analysis reports
- **Rich Visualizations**: High-resolution charts, graphs, and comparison images
- **Statistical Summaries**: Detailed statistical analysis with tables and metrics
- **Settings Documentation**: Optional analysis settings report for reproducibility
- **Multi-language Support**: Reports available in English and Turkish

### 🌐 **Web Interface**
- **Interactive Image Selection**: Click-and-drag region selection for targeted analysis
- **Real-time Progress Tracking**: Visual progress indicators for analysis steps
- **Sample Test Library**: Pre-configured test cases with example reports
- **Source Code Download**: Download analysis code in Python (.py) or Jupyter Notebook (.ipynb) formats
- **Responsive Design**: Modern, intuitive user interface
- **Feedback System**: Built-in feedback mechanism for user suggestions

### 🔬 **Advanced Capabilities**
- **Flexible Sampling Modes**: Random, grid-based, or manual point selection
- **Region of Interest (ROI) Analysis**: Circular or rectangular region selection
- **Single Image Mode**: Analyze individual images without reference comparison
- **Batch Processing Support**: Session-based processing for multiple analyses
- **Google Colab Integration**: Standalone Python script compatible with Google Colab

---

## 🛠 Technology Stack

### Backend
- **Web Framework**: Flask 2.3+
- **Language**: Python 3.8+
- **Image Processing**: 
  - OpenCV 4.5+ (Computer vision operations)
  - Pillow 9.0+ (Image manipulation)
  - scikit-image 0.19+ (Advanced image analysis)
- **Scientific Computing**:
  - NumPy 1.21+ (Numerical operations)
  - SciPy 1.7+ (Scientific algorithms)
  - Pandas 1.3+ (Data analysis)
- **Signal Processing**: PyWavelets 1.1+ (Wavelet transforms)
- **PDF Generation**: ReportLab 3.6+ (Professional PDF creation)
- **Visualization**: Matplotlib 3.5+ (Charts and graphs)

### Frontend
- **HTML5/CSS3**: Modern, responsive web interface
- **JavaScript (ES6+)**: Interactive functionality and API communication
- **Internationalization**: Custom i18n system supporting multiple languages

### Development Tools
- **Version Control**: Git
- **Code Quality**: PEP 8 compliant Python code
- **Documentation**: Comprehensive inline documentation and datasheets

---

## 📦 Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Git (for cloning the repository)

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/SpectroTXQS.git
   cd SpectroTXQS
   ```

2. **Create a Virtual Environment** (Recommended)
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify Installation**
   ```bash
   python -c "import flask, cv2, numpy, pandas; print('Installation successful!')"
   ```

### Optional: Google Colab Setup

The system can also be run directly in Google Colab. Simply upload `BackEND.py` to Colab and execute. All required packages will be installed automatically.

---

## 🚀 Usage

### Web Application

1. **Start the Flask Server**
   ```bash
   python app.py
   ```

2. **Access the Web Interface**
   - Open your web browser and navigate to `http://localhost:5000`
   - The main interface will load with all analysis options

3. **Upload Images**
   - Click "Upload Reference Image" to select your reference textile sample
   - Click "Upload Test Image" to select the sample to be analyzed
   - Images are automatically resized to match dimensions

4. **Configure Analysis Settings** (Optional)
   - Click "Advanced Settings" to customize:
     - Color thresholds (Delta E, LAB)
     - Pattern similarity thresholds
     - Sampling parameters
     - Region of interest selection
     - Report sections to include

5. **Select Analysis Region** (Optional)
   - Use the interactive region selector to define areas of interest
   - Choose between circular or rectangular selection
   - Adjust size and position as needed

6. **Start Processing**
   - Click "Start Processing" to begin analysis
   - Monitor progress through the real-time progress indicator
   - Analysis typically completes in 30-60 seconds depending on image size

7. **Download Reports**
   - After processing completes, download the comprehensive PDF report
   - Optionally download the analysis settings report for reproducibility

### Command-Line Usage (Colab Mode)

For standalone Python execution (e.g., in Google Colab):

```python
# Import the analysis engine
from BackEND import run_pipeline_and_build_pdf, QCSettings, read_rgb, to_same_size

# Load images
ref_path = "reference_image.jpg"
test_path = "test_image.jpg"
ref = read_rgb(ref_path)
test = read_rgb(test_path)
ref, test = to_same_size(ref, test)

# Configure settings
settings = QCSettings()
settings.language = "en"  # or "tr" for Turkish
settings.delta_e_threshold = 2.0
settings.num_sample_points = 5

# Run analysis and generate report
pdf_path = run_pipeline_and_build_pdf(ref_path, test_path, ref, test, settings)
print(f"Report generated: {pdf_path}")
```

### Sample Tests

The system includes pre-configured sample tests accessible through the web interface:

- Navigate to the "Samples" sidebar
- Select a sample test case
- View pre-generated reports and analysis results
- Use samples as reference for your own analyses

---

## 📁 Project Structure

```
SpectroTXQS/
│
├── app.py                      # Flask web application entry point
├── BackEND.py                  # Core analysis engine (7699 lines)
├── requirements.txt            # Python dependencies
├── README.md                   # This file
│
├── templates/
│   └── index.html             # Main web interface template
│
├── static/
│   ├── css/
│   │   ├── main.css           # Main stylesheet
│   │   ├── components.css     # Component styles
│   │   └── modal.css          # Modal dialog styles
│   │
│   ├── js/
│   │   ├── app.js             # Main application logic
│   │   ├── i18n.js            # Internationalization system
│   │   ├── region-selector.js # Region selection functionality
│   │   └── development-modal.js # Development tools
│   │
│   ├── images/                # Application assets and logos
│   │
│   └── docs/
│       ├── datasheet_en.pdf   # English technical datasheet
│       └── datasheet_tr.pdf  # Turkish technical datasheet
│
├── Samples/
│   ├── images/                # Sample test images
│   └── REPORTS/               # Pre-generated sample reports
│
└── DataSheets/
    ├── Datasheet EN.pdf       # English datasheet (alternative location)
    └── Datasheet TR.pdf       # Turkish datasheet (alternative location)
```

---

## 🔬 Analysis Capabilities

### Color Analysis Metrics

| Metric | Description | Industry Standard |
|--------|-------------|-------------------|
| **ΔE (Delta E)** | Total color difference in LAB color space | CIE76, CIE94, CIEDE2000 |
| **L\* (Lightness)** | Perceptual lightness channel | 0-100 scale |
| **a\* (Red-Green)** | Red-green color component | -128 to +127 |
| **b\* (Blue-Yellow)** | Blue-yellow color component | -128 to +127 |
| **Color Uniformity** | Standard deviation of color distribution | Lower is better |
| **Spectral Reflectance** | Estimated spectral response from RGB | 400-700 nm range |

### Pattern Analysis Metrics

| Metric | Description | Range |
|--------|-------------|-------|
| **SSIM** | Structural Similarity Index | 0.0 - 1.0 (1.0 = identical) |
| **Pattern Repetition Count** | Number of pattern instances detected | Integer count |
| **Symmetry Score** | Pattern symmetry assessment | 0.0 - 1.0 |
| **Edge Quality** | Edge detection and sharpness metrics | Various scales |
| **Spatial Distribution** | Pattern distribution uniformity | Grid-based analysis |

### Texture Analysis Features

- **FFT Peak Detection**: Identifies dominant frequencies in patterns
- **Gabor Response**: Multi-scale texture orientation analysis
- **GLCM Properties**: Contrast, correlation, energy, homogeneity
- **LBP Histogram**: Rotation-invariant texture patterns
- **Wavelet Coefficients**: Multi-resolution texture decomposition
- **HOG Density**: Gradient orientation distribution

---

## 📄 Report Generation

The system generates comprehensive PDF reports containing:

### Report Sections

1. **Cover Page**
   - Company branding and report metadata
   - Analysis timestamp and operator information
   - Quality assessment summary

2. **Analysis Settings** (Optional)
   - Complete configuration parameters
   - Threshold values and sampling settings
   - Region of interest specifications

3. **Color Analysis Unit**
   - Input images with region overlays
   - Color measurement tables (RGB, LAB, ΔE)
   - Statistical summaries and distributions
   - Visual difference maps and heatmaps
   - Quality assessment and recommendations

4. **Pattern Analysis Unit**
   - SSIM comparison and metrics
   - Symmetry analysis results
   - Edge detection visualizations
   - Pattern repetition analysis
   - Advanced texture analysis results

5. **Pattern Repetition Unit**
   - Pattern count and distribution
   - Blob detection results
   - Spatial distribution maps
   - Repetition quality assessment

6. **Spectral Analysis Unit**
   - Estimated spectral reflectance curves
   - RGB-to-spectral conversion results
   - Wavelength-specific analysis

7. **Summary & Recommendations**
   - Overall quality scores
   - Pass/Fail/Conditional status
   - Actionable recommendations
   - Quality improvement suggestions

### Report Customization

Users can customize reports by:
- Enabling/disabling specific sections
- Adjusting visualization parameters
- Selecting analysis depth (basic/advanced)
- Choosing report language (English/Turkish)

---

## 🌍 Internationalization

The system supports multiple languages through a comprehensive i18n system:

### Supported Languages
- **English (en)**: Default language
- **Turkish (tr)**: Full translation available

### Translation Coverage
- User interface elements
- Report content and sections
- Error messages and notifications
- Help documentation and tooltips
- Datasheets and technical documentation

### Adding New Languages

To add support for additional languages:

1. Extend the `translations` object in `static/js/i18n.js`
2. Add language-specific strings following the existing pattern
3. Update the language switcher UI component
4. Translate report templates in `BackEND.py`

---

## 💻 Development

### Running in Development Mode

```bash
# Set Flask to development mode
export FLASK_ENV=development  # Linux/macOS
set FLASK_ENV=development     # Windows

# Enable debug mode
export FLASK_DEBUG=1          # Linux/macOS
set FLASK_DEBUG=1             # Windows

# Run the application
python app.py
```

### Code Structure

- **Modular Design**: Separation of concerns between web interface and analysis engine
- **Session Management**: Flask-based session handling for concurrent users
- **Error Handling**: Comprehensive error handling and logging
- **Performance Optimization**: Caching and optimization for large image processing

### Testing

```bash
# Run basic functionality tests
python -m pytest tests/

# Test specific modules
python -m pytest tests/test_color_analysis.py
python -m pytest tests/test_pattern_analysis.py
```

### Debugging

- Enable Flask debug mode for detailed error messages
- Check application logs in the console output
- Review browser console for frontend issues
- Use sample test cases to verify functionality

---

## 🤝 Contributing

We welcome contributions to improve the Textile QC System! Here's how you can help:

### Contribution Guidelines

1. **Fork the Repository**
   - Create your own fork of the project
   - Clone your fork to your local machine

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow PEP 8 style guidelines for Python code
   - Add comments and documentation for new features
   - Ensure backward compatibility when possible

4. **Test Your Changes**
   - Test with sample images
   - Verify report generation works correctly
   - Check for any performance regressions

5. **Submit a Pull Request**
   - Write a clear description of your changes
   - Reference any related issues
   - Ensure all tests pass

### Areas for Contribution

- **New Analysis Algorithms**: Implement additional texture or color analysis methods
- **Performance Optimization**: Improve processing speed for large images
- **UI/UX Enhancements**: Improve user interface and user experience
- **Documentation**: Expand documentation and add tutorials
- **Language Support**: Add translations for additional languages
- **Testing**: Add unit tests and integration tests
- **Bug Fixes**: Report and fix bugs

### Code Style

- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ES6+ syntax, consistent indentation
- **HTML/CSS**: Semantic HTML, organized CSS structure
- **Comments**: Clear, descriptive comments for complex logic

---

## 👤 Author

**Abdelbary Algamel**

- **Institution**: Textile Engineering Solutions
- **Specialization**: Textile Quality Control & Color Science
- **Contact**: [Add contact information if available]
- **Date**: December 2025

### Acknowledgments

- Textile industry partners for testing and feedback
- Open-source community for excellent libraries and tools
- Research community for color science and pattern recognition algorithms

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### License Summary

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

---

## 📚 Additional Resources

### Documentation

- **Technical Datasheet (English)**: `DataSheets/Datasheet EN.pdf`
- **Technical Datasheet (Turkish)**: `DataSheets/Datasheet TR.pdf`
- **Source Code**: Available for download through the web interface



### Citations

If you use this system in your research, please cite:

```bibtex
@software{textile_qc_system,
  title = {Textile QC System: Professional Color \& Pattern Analysis},
  author = {Algamel, Abdelbary},
  year = {2025},
  version = {1.1.0},
  url = {https://github.com/yourusername/SpectroTXQS}
}
```

---

## 🆘 Support & Feedback

### Getting Help

- **Documentation**: Check the technical datasheets for detailed information
- **Sample Tests**: Review sample test cases for usage examples
- **Issues**: Report bugs or request features through GitHub Issues
- **Feedback**: Use the built-in feedback system in the web interface

### Common Issues

**Q: Analysis takes too long**  
A: Large images (>10MP) may take longer. Consider resizing images or using region selection.

**Q: Report generation fails**  
A: Ensure sufficient disk space and check file permissions. Review console logs for specific errors.

**Q: Colors appear incorrect**  
A: Verify images are in RGB color space. Some formats may require conversion.

---

<div align="center">

**Made with ❤️ for the Textile Industry**

*Advancing Quality Control Through Technology*

[⬆ Back to Top](#-textile-qc-system)

</div>
