# 🚀 Starboard AI - Multi-County Industrial Property Analysis

> **Advanced AI-Powered Industrial Property Comparable Analysis with Real Data**

## 🏭 Overview

Starboard AI is a revolutionary industrial property analysis platform that combines **real property data** with **artificial intelligence** to provide the most accurate comparable analysis available. Unlike traditional systems that rely on limited data or simple matching, Starboard AI understands the nuances of industrial zoning classifications and provides intelligent, multi-factor analysis.

## ✨ Key Features

### 🗺️ Real Data Coverage
- **2,005+ Authentic Industrial Properties** across 3 major markets
- **Professional ATTOM API Integration** for verified property data
- **Multi-County Coverage**: Cook County (Chicago), Dallas County, Los Angeles County
- **Value Range**: $81,600 - $95,915,760 assessed values
- **Size Range**: 1,360 - 1,598,596 sq ft building areas

### 🤖 AI Intelligence
- **5 Intelligent Zoning Classifications**:
  - **M-1 (Light Manufacturing)**: 1,439 properties - Assembly, packaging, light production
  - **M-2 (Manufacturing)**: 178 properties - Standard manufacturing facilities
  - **I-1 (Light Industrial)**: 371 properties - Warehouses, distribution centers
  - **I-2 (Heavy Industrial)**: 9 properties - Large manufacturing, heavy processing
  - **I-3 (Heavy Industrial)**: 8 properties - Massive facilities, major operations

- **Multi-Factor Similarity Analysis**:
  - Size correlation with confidence scoring
  - Location intelligence and regional market analysis
  - Value analysis (assessed and market values)
  - Zoning intelligence with semantic understanding

- **AI-Generated Confidence Scoring** for each comparable
- **Intelligent Outlier Detection** for data quality
- **Quality Validation** with reliability scoring

### 🛡️ Security & Quality
- **No Hardcoded API Keys** - Environment-based configuration
- **Secure Environment Template** for easy setup
- **AI-Enhanced Data Validation** with quality scoring
- **Professional Data Source** (ATTOM API)

### 🎨 Modern UI/UX
- **Glassmorphism Design** with modern glass-like effects
- **Gradient Backgrounds** for professional visual appeal
- **Responsive Layout** that works on all devices
- **Interactive Elements** with smooth animations
- **Dark/Light Theme** toggle for user preference

## 🏗️ Architecture

### Backend (FastAPI + Python)
```
backend/
├── app.py                          # FastAPI application with AI endpoints
├── database.py                     # SQLAlchemy models and database setup
├── agents/
│   ├── api_discovery_agent.py      # ATTOM API discovery and field mapping
│   ├── data_extraction_system.py   # AI-enhanced data processing
│   └── comparable_discovery_agent.py # Multi-factor property comparison
├── models/
│   └── property_models.py          # Zoning-aware data models
├── extract_real_county_data.py     # ATTOM API integration
└── requirements.txt                # Production dependencies
```

### Frontend (Next.js + React)
```
frontend/
├── src/
│   ├── app/                        # Next.js 13+ app directory
│   ├── components/                 # React components
│   │   ├── PropertyInput.tsx      # Property input form
│   │   ├── ComparableResults.tsx  # Results display
│   │   └── ThemeToggle.tsx        # Theme switching
│   └── styles/                     # CSS and styling
├── package.json                    # Node.js dependencies
└── next.config.js                  # Next.js configuration
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git** for version control

### 1. Clone the Repository
```bash
git clone https://github.com/Tharunbaikani/Starboard-AI.git
cd starboard-ai
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.template .env
# Edit .env file with your API keys:
# ATTOMDATA_API_KEY=your_attom_api_key
# OPENAI_API_KEY=your_openai_api_key
**Load Database with Property Data**
   ```bash
   # Initial data extraction (up to 10,000 properties)
   python extract_real_county_data.py
   
   # For scheduled updates (runs every 24 hours)
   python scheduled_extraction.py
   ```

# Start the backend server
uvicorn app:main --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🧪 Testing Examples

### Small Manufacturing Property
```json
{
  "address": "1852 W 21ST ST, CHICAGO, IL 60608",
  "building_area": 5900,
  "zoning_code": "M-1",
  "county": "Cook County, IL"
}
```

### Large Industrial Property
```json
{
  "address": "2801 S SANTA FE AVE, VERNON, CA 90058",
  "building_area": 107867,
  "zoning_code": "I-2",
  "county": "Los Angeles County, CA"
}
```

### Cross-County Comparison
```json
{
  "address": "1300 WYCLIFF AVE, DALLAS, TX 75207",
  "building_area": 43000,
  "zoning_code": "I-1",
  "county": "Dallas County, TX"
}
```

## 📊 Data Statistics

### Geographic Coverage
- **Cook County, Illinois**: 203 industrial properties
- **Dallas County, Texas**: 196 industrial properties
- **Los Angeles County, California**: 147 industrial properties

### Zoning Distribution
- **M-1 (Light Manufacturing)**: 1,439 properties
- **M-2 (Manufacturing)**: 178 properties
- **I-1 (Light Industrial)**: 371 properties
- **I-2 (Heavy Industrial)**: 9 properties
- **I-3 (Heavy Industrial)**: 8 properties

### Value Ranges by County
- **Cook County**: $81,600 - $2,706,000
- **Dallas County**: $245,520 - $95,915,760
- **Los Angeles County**: $1,626,720 - $6,472,020

## 🔧 API Endpoints

### Core Endpoints
- `POST /api/properties/comparables` - Find comparable properties
- `POST /api/properties/search` - Search properties with filters
- `GET /api/counties` - Get supported counties
- `GET /api/data/stats` - Get database statistics

### Example API Usage
```bash
# Find comparables for a property
curl -X POST "http://localhost:8000/api/properties/comparables" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "1852 W 21ST ST, CHICAGO, IL 60608",
    "building_area": 5900,
    "zoning_code": "M-1",
    "county": "Cook County, IL"
  }'

# Get database statistics
curl "http://localhost:8000/api/data/stats"
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: High-performance async web framework
- **SQLAlchemy**: Advanced ORM with industrial property models
- **OpenAI GPT**: AI-powered analysis and validation
- **ATTOM API**: Professional real estate data source
- **SQLite**: Optimized local database with 2,000+ properties

### Frontend
- **Next.js 13+**: React framework with app directory
- **React 18**: Modern UI components
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Beautiful icons

### AI & Data
- **OpenAI API**: GPT-4 for intelligent analysis
- **ATTOM API**: Professional real estate data
- **Multi-Agent Architecture**: Intelligent data processing
- **Quality Scoring**: AI-enhanced validation

## 🚀 Deployment

### Environment Variables
```bash
# Required for production
ATTOMDATA_API_KEY=your_attom_api_key
OPENAI_API_KEY=your_openai_api_key

# Optional
DATABASE_URL=sqlite:///./starboard_properties.db
LOG_LEVEL=INFO
```

### Production Deployment
```bash
# Backend (using uvicorn)
uvicorn app:main --host 0.0.0.0 --port 8000

# Frontend (using Next.js)
npm run build
npm start
```

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🎯 Key Differentiators

1. **Real Data**: 2,000+ authentic properties vs. mock data
2. **AI Intelligence**: Multi-factor analysis vs. simple matching
3. **Zoning Expertise**: 5 classifications vs. generic "industrial"
4. **Cross-Market Analysis**: Multi-county comparison capabilities
5. **Professional Quality**: Production-ready system with security
6. **Modern UI**: Beautiful, responsive interface
7. **Scalable Architecture**: Built for enterprise use

---

**Starboard AI** - The future of industrial property analysis powered by real data and artificial intelligence. 🏭🤖

