# -*- coding: utf-8 -*-
"""
Textile QC System - Flask Web Application
Wraps the analysis engine for web deployment
"""

import io
import os
import sys
import base64
import json
import uuid
import shutil
import tempfile
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify, send_file, send_from_directory, render_template

# ==============================================================================
# FLASK APPLICATION SETUP
# ==============================================================================
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload
app.config['UPLOAD_FOLDER'] = tempfile.mkdtemp(prefix='textile_qc_')

# Session storage for analysis results
SESSIONS = {}

# ==============================================================================
# IMPORT ANALYSIS ENGINE
# ==============================================================================
# We'll import from the main analysis file
# First, let's set up the path and imports

import warnings
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import cv2
from PIL import Image, ImageDraw
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from skimage.metrics import structural_similarity as ssim
from skimage.color import rgb2gray

# ReportLab for PDF
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Image as RLImage, Table, TableStyle,
                                Spacer, PageBreak, Flowable, KeepTogether)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

# Advanced analysis libraries
import pywt
from scipy import signal, ndimage
from scipy.stats import chi2
from scipy.spatial.distance import euclidean
from skimage.feature import local_binary_pattern, graycomatrix, graycoprops
from skimage.filters import gabor_kernel, threshold_otsu
from skimage.morphology import disk, white_tophat, black_tophat, opening, closing
from skimage.measure import label, regionprops
from skimage.util import img_as_ubyte

import logging
from functools import lru_cache
from dataclasses import dataclass, field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# ==============================================================================
# LOAD THE ANALYSIS ENGINE FROM BackEND.py
# ==============================================================================
# Import all the analysis code from the original file
# We need to exec the file but skip the main() call and Colab-specific imports

def load_analysis_engine():
    """Load the analysis engine from BackEND.py, excluding Colab-specific code"""
    global QCSettings, run_pipeline_and_build_pdf, generate_analysis_settings_report
    global read_rgb, to_same_size, TRANSLATIONS, tr, get_text
    
    # Read the original file
    original_file = os.path.join(os.path.dirname(__file__), 'BackEND.py')
    
    if not os.path.exists(original_file):
        raise RuntimeError("BackEND.py not found!")
    
    with open(original_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Remove or replace emojis that cause encoding issues
    import re
    # Replace emoji characters with placeholders
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        "]+", flags=re.UNICODE)
    code = emoji_pattern.sub('*', code)
    
    # Remove Colab-specific lines
    lines = code.split('\n')
    filtered_lines = []
    skip_block = False
    
    for i, line in enumerate(lines):
        # Skip Colab imports and pip installs
        if 'from google.colab' in line:
            continue
        if 'from IPython.display' in line:
            # Replace with dummy
            filtered_lines.append('# IPython display disabled for Flask')
            filtered_lines.append('def display(*args, **kwargs): pass')
            filtered_lines.append('def clear_output(*args, **kwargs): pass')
            filtered_lines.append('class HTML: pass')
            continue
        if '!pip' in line or '!apt-get' in line:
            continue
        if 'import ipywidgets' in line or 'from ipywidgets' in line:
            continue
        if 'colab_files' in line:
            continue
        # Skip the main() call at the end
        if line.strip() == 'main()':
            continue
        # Skip widget-related functions
        if 'def upload_two_images' in line:
            skip_block = True
        if skip_block:
            if line and not line[0].isspace() and not line.startswith('def upload_two_images'):
                skip_block = False
            else:
                continue
        # Skip the main() function definition and everything after
        if 'def main():' in line:
            break
            
        filtered_lines.append(line)
    
    filtered_code = '\n'.join(filtered_lines)
    
    # Create a namespace for execution
    namespace = {
        '__name__': '__main__',
        '__file__': original_file,
        'np': np,
        'pd': pd,
        'cv2': cv2,
        'Image': Image,
        'ImageDraw': ImageDraw,
        'plt': plt,
        'ssim': ssim,
        'rgb2gray': rgb2gray,
        'A4': A4,
        'inch': inch,
        'colors': colors,
        'ParagraphStyle': ParagraphStyle,
        'getSampleStyleSheet': getSampleStyleSheet,
        'canvas': canvas,
        'SimpleDocTemplate': SimpleDocTemplate,
        'Paragraph': Paragraph,
        'RLImage': RLImage,
        'Table': Table,
        'TableStyle': TableStyle,
        'Spacer': Spacer,
        'PageBreak': PageBreak,
        'Flowable': Flowable,
        'KeepTogether': KeepTogether,
        'TA_LEFT': TA_LEFT,
        'TA_RIGHT': TA_RIGHT,
        'TA_CENTER': TA_CENTER,
        'pywt': pywt,
        'signal': signal,
        'ndimage': ndimage,
        'chi2': chi2,
        'euclidean': euclidean,
        'local_binary_pattern': local_binary_pattern,
        'graycomatrix': graycomatrix,
        'graycoprops': graycoprops,
        'gabor_kernel': gabor_kernel,
        'threshold_otsu': threshold_otsu,
        'disk': disk,
        'white_tophat': white_tophat,
        'black_tophat': black_tophat,
        'opening': opening,
        'closing': closing,
        'label': label,
        'regionprops': regionprops,
        'img_as_ubyte': img_as_ubyte,
        'logging': logging,
        'lru_cache': lru_cache,
        'dataclass': dataclass,
        'field': field,
        'datetime': datetime,
        'timedelta': timedelta,
        'io': io,
        'os': os,
        'base64': base64,
        'math': __import__('math'),
        'textwrap': __import__('textwrap'),
        'tempfile': tempfile,
        'uuid': uuid,
        'warnings': warnings,
        'logger': logger,
    }
    
    try:
        exec(filtered_code, namespace)
    except Exception as e:
        logger.error(f"Error loading analysis engine: {e}")
        raise
    
    # Extract the functions and classes we need
    return namespace

# Load the analysis engine
try:
    _engine = load_analysis_engine()
    QCSettings = _engine.get('QCSettings')
    run_pipeline_and_build_pdf = _engine.get('run_pipeline_and_build_pdf')
    generate_analysis_settings_report = _engine.get('generate_analysis_settings_report')
    read_rgb = _engine.get('read_rgb')
    to_same_size = _engine.get('to_same_size')
    TRANSLATIONS = _engine.get('TRANSLATIONS', {})
    tr = _engine.get('tr', lambda key, settings: key)
    get_text = _engine.get('get_text', lambda key, lang: key)
    logger.info("Analysis engine loaded successfully")
except Exception as e:
    logger.error(f"Failed to load analysis engine: {e}")
    # Create dummy classes/functions for fallback
    QCSettings = None
    run_pipeline_and_build_pdf = None
    generate_analysis_settings_report = None

# ==============================================================================
# FLASK ROUTES
# ==============================================================================

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

@app.route('/api/settings/default', methods=['GET'])
def get_default_settings():
    """Return default QC settings"""
    if QCSettings is None:
        return jsonify({'error': 'Analysis engine not loaded'}), 500
    
    settings = QCSettings()
    return jsonify({
        'delta_e_threshold': settings.delta_e_threshold,
        'delta_e_conditional': settings.delta_e_conditional,
        'ssim_pass_threshold': settings.ssim_pass_threshold,
        'ssim_conditional_threshold': settings.ssim_conditional_threshold,
        'color_score_threshold': settings.color_score_threshold,
        'pattern_score_threshold': settings.pattern_score_threshold,
        'overall_score_threshold': settings.overall_score_threshold,
        'use_delta_e_cmc': settings.use_delta_e_cmc,
        'cmc_l_c_ratio': settings.cmc_l_c_ratio,
        'observer_angle': settings.observer_angle,
        'geometry_mode': settings.geometry_mode,
        'lbp_points': settings.lbp_points,
        'lbp_radius': settings.lbp_radius,
        'wavelet_type': settings.wavelet_type,
        'wavelet_levels': settings.wavelet_levels,
        'pattern_min_area': settings.pattern_min_area,
        'pattern_max_area': settings.pattern_max_area,
        'keypoint_detector': settings.keypoint_detector,
        'enable_color_unit': settings.enable_color_unit,
        'enable_pattern_unit': settings.enable_pattern_unit,
        'enable_pattern_repetition': settings.enable_pattern_repetition,
        'enable_spectrophotometer': settings.enable_spectrophotometer,
        'enable_analysis_settings': settings.enable_analysis_settings,
        'operator_name': settings.operator_name,
    })

@app.route('/api/upload', methods=['POST'])
def upload_images():
    """Handle image upload"""
    try:
        if 'reference' not in request.files or 'sample' not in request.files:
            return jsonify({'error': 'Both reference and sample images are required'}), 400
        
        ref_file = request.files['reference']
        sample_file = request.files['sample']
        
        if ref_file.filename == '' or sample_file.filename == '':
            return jsonify({'error': 'No files selected'}), 400
        
        # Create session
        session_id = str(uuid.uuid4())
        session_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # Save files
        ref_path = os.path.join(session_dir, 'reference' + os.path.splitext(ref_file.filename)[1])
        sample_path = os.path.join(session_dir, 'sample' + os.path.splitext(sample_file.filename)[1])
        
        ref_file.save(ref_path)
        sample_file.save(sample_path)
        
        # Store session info
        SESSIONS[session_id] = {
            'ref_path': ref_path,
            'sample_path': sample_path,
            'created': datetime.now(),
            'results': None
        }
        
        logger.info(f"Session created: {session_id}")
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'message': 'Images uploaded successfully'
        })
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Run the analysis pipeline"""
    try:
        data = request.get_json()
        
        if not data or 'session_id' not in data:
            return jsonify({'error': 'Session ID required'}), 400
        
        session_id = data['session_id']
        
        if session_id not in SESSIONS:
            return jsonify({'error': 'Invalid session'}), 400
        
        session = SESSIONS[session_id]
        ref_path = session['ref_path']
        sample_path = session['sample_path']
        
        if QCSettings is None or run_pipeline_and_build_pdf is None:
            return jsonify({'error': 'Analysis engine not loaded'}), 500
        
        # Create settings from request
        settings = QCSettings()
        user_settings = data.get('settings', {})
        
        # Apply user settings
        for key, value in user_settings.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
        
        # Set language based on request
        settings.language = user_settings.get('language', 'en')
        
        # Read and prepare images
        logger.info(f"Reading images for session {session_id}")
        ref = read_rgb(ref_path)
        test = read_rgb(sample_path)
        ref, test = to_same_size(ref, test)
        
        logger.info(f"Starting analysis: {ref.shape}")
        
        # Change to session directory for temp files
        original_cwd = os.getcwd()
        session_dir = os.path.dirname(ref_path)
        os.chdir(session_dir)
        
        try:
            # Run main analysis pipeline - returns dict with scores and pdf_path
            analysis_result = run_pipeline_and_build_pdf(ref_path, sample_path, ref, test, settings)
            
            # Extract PDF path from result (now returns dict)
            pdf_file = analysis_result['pdf_path']
            
            # Generate settings report
            settings_pdf_file = generate_analysis_settings_report(ref_path, sample_path, ref, test, settings)
            
            # Move PDFs to session directory if needed
            if not os.path.dirname(pdf_file):
                pdf_file = os.path.join(session_dir, pdf_file)
            if not os.path.dirname(settings_pdf_file):
                settings_pdf_file = os.path.join(session_dir, settings_pdf_file)
            
            # Store results
            session['results'] = {
                'pdf_file': pdf_file,
                'settings_pdf_file': settings_pdf_file,
            }
            
            logger.info(f"Analysis complete for session {session_id}")
            
            # Return actual scores from analysis
            return jsonify({
                'success': True,
                'decision': analysis_result['decision'],
                'color_score': analysis_result['color_score'],
                'pattern_score': analysis_result['pattern_score'],
                'overall_score': analysis_result['overall_score'],
                'pdf_filename': os.path.basename(pdf_file),
                'settings_pdf_filename': os.path.basename(settings_pdf_file),
            })
            
        finally:
            os.chdir(original_cwd)
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        logger.error(f"Analysis error: {e}")
        logger.error(f"Full traceback:\n{error_traceback}")
        print(f"\n{'='*60}\nANALYSIS ERROR:\n{'='*60}")
        print(error_traceback)
        print('='*60 + '\n')
        return jsonify({
            'error': str(e),
            'error_details': error_traceback,
            'decision': 'ERROR',
            'color_score': 0,
            'pattern_score': 0,
            'overall_score': 0
        }), 500

@app.route('/api/download/<session_id>/<filename>', methods=['GET'])
def download_file(session_id, filename):
    """Download a generated PDF file"""
    try:
        if session_id not in SESSIONS:
            return jsonify({'error': 'Invalid session'}), 404
        
        session = SESSIONS[session_id]
        session_dir = os.path.dirname(session['ref_path'])
        
        file_path = os.path.join(session_dir, filename)
        
        if not os.path.exists(file_path):
            # Try results
            if session.get('results'):
                if filename == os.path.basename(session['results'].get('pdf_file', '')):
                    file_path = session['results']['pdf_file']
                elif filename == os.path.basename(session['results'].get('settings_pdf_file', '')):
                    file_path = session['results']['settings_pdf_file']
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"Download error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/source/<file_type>', methods=['GET'])
def download_source(file_type):
    """Download source code"""
    try:
        source_file = os.path.join(os.path.dirname(__file__), 'BackEND.py')
        
        if not os.path.exists(source_file):
            return jsonify({'error': 'Source file not found'}), 404
        
        if file_type == 'py':
            return send_file(
                source_file,
                as_attachment=True,
                download_name='TextileQC_Analysis.py',
                mimetype='text/x-python'
            )
        elif file_type == 'ipynb':
            # Convert to notebook format
            with open(source_file, 'r', encoding='utf-8') as f:
                code = f.read()
            
            notebook = {
                "nbformat": 4,
                "nbformat_minor": 0,
                "metadata": {
                    "colab": {"name": "TextileQC_Analysis.ipynb"},
                    "kernelspec": {"name": "python3", "display_name": "Python 3"}
                },
                "cells": [
                    {
                        "cell_type": "code",
                        "execution_count": None,
                        "metadata": {},
                        "outputs": [],
                        "source": code.split('\n')
                    }
                ]
            }
            
            return jsonify(notebook), 200, {
                'Content-Disposition': 'attachment; filename=TextileQC_Analysis.ipynb',
                'Content-Type': 'application/json'
            }
        else:
            return jsonify({'error': 'Invalid file type'}), 400
            
    except Exception as e:
        logger.error(f"Source download error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/source/textileqc/raw', methods=['GET'])
def get_raw_source():
    """Get raw source code content"""
    try:
        source_file = os.path.join(os.path.dirname(__file__), 'BackEND.py')
        
        if not os.path.exists(source_file):
            return "Source file not found", 404
        
        with open(source_file, 'r', encoding='utf-8') as f:
            return f.read(), 200, {'Content-Type': 'text/plain; charset=utf-8'}
            
    except Exception as e:
        return str(e), 500

@app.route('/api/download/logo/<filename>', methods=['GET'])
def download_logo(filename):
    """Download logo files"""
    try:
        logo_path = os.path.join(os.path.dirname(__file__), 'static', 'images', filename)
        
        if not os.path.exists(logo_path):
            return jsonify({'error': 'Logo not found'}), 404
        
        return send_file(
            logo_path,
            as_attachment=True,
            download_name=filename,
            mimetype='image/png'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/datasheet/<lang>', methods=['GET'])
def download_datasheet(lang):
    """Download datasheet PDF"""
    try:
        filename = f'datasheet_{lang}.pdf'
        datasheet_path = os.path.join(os.path.dirname(__file__), 'static', 'docs', filename)
        
        if not os.path.exists(datasheet_path):
            # Return a placeholder message
            return jsonify({'error': 'Datasheet not available yet'}), 404
        
        return send_file(
            datasheet_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/samples/list', methods=['GET'])
def get_samples_list():
    """Get list of sample tests from the Samples folder"""
    # Return sample test configurations using images from Samples/images/
    # Images are paired by number: 001X where X=1 is reference, X=2 is sample
    samples = [
        {
            'id': 1,
            'name': 'Test 1',
            'reference': '0011.png',
            'sample': '0012.png',
        },
        {
            'id': 2,
            'name': 'Test 2',
            'reference': '0021.png',
            'sample': '0022.png',
        },
        {
            'id': 3,
            'name': 'Test 3',
            'reference': '0031.png',
            'sample': '0032.png',
        },
    ]
    return jsonify(samples)

@app.route('/api/samples/image/<filename>', methods=['GET'])
def get_sample_image(filename):
    """Get sample test image from the Samples/images folder"""
    try:
        # Sample images are stored in Samples/images/ folder (NOT static/images)
        image_path = os.path.join(os.path.dirname(__file__), 'Samples', 'images', filename)
        
        if not os.path.exists(image_path):
            return jsonify({'error': 'Sample image not found'}), 404
        
        return send_file(image_path, mimetype='image/png')
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/samples/report/<int:sample_id>', methods=['GET'])
def get_sample_report(sample_id):
    """Get pre-generated sample report from Samples/REPORTS folder"""
    try:
        lang = request.args.get('lang', 'en')
        
        # Pre-generated reports are stored in Samples/REPORTS/
        # English: REPORT1.pdf, REPORT2.pdf, REPORT3.pdf
        # Turkish: REPORTtr1.pdf, REPORTtr2.pdf, REPORTtr3.pdf
        if lang == 'tr':
            filename = f'REPORTtr{sample_id}.pdf'
        else:
            filename = f'REPORT{sample_id}.pdf'
        
        report_path = os.path.join(os.path.dirname(__file__), 'Samples', 'REPORTS', filename)
        
        if not os.path.exists(report_path):
            return jsonify({'error': f'Report not found: {filename}'}), 404
        
        return send_file(
            report_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==============================================================================
# CLEANUP
# ==============================================================================
import atexit

def cleanup_sessions():
    """Clean up temporary files on exit"""
    try:
        if os.path.exists(app.config['UPLOAD_FOLDER']):
            shutil.rmtree(app.config['UPLOAD_FOLDER'])
            logger.info("Cleaned up temporary files")
    except Exception as e:
        logger.error(f"Cleanup error: {e}")

atexit.register(cleanup_sessions)

# ==============================================================================
# MAIN
# ==============================================================================
if __name__ == '__main__':
    print("=" * 60)
    print("TEXTILE QC SYSTEM - Web Application")
    print("=" * 60)
    print(f"Upload folder: {app.config['UPLOAD_FOLDER']}")
    
    # Get port from environment variable (for Render) or use default
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Starting server on port {port}")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
