import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Activity } from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import ResultsChart from './components/ResultsChart';
import ComplexityInfo from './components/ComplexityInfo';
import { detectEmpiricalComplexity } from './utils/curveFitting';

const TEMPLATES = {
  "manual": {
    name: "Manual Mode",
    theoretical: null,
    code: `import random

def generate_input(n):
    """Generates an array of n random integers."""
    return [random.randint(0, 1000) for _ in range(n)]

def target_function(arr):
    """
    Example O(N) function: finds the maximum element.
    Replace this with your algorithm to benchmark.
    """
    if not arr: return None
    max_val = arr[0]
    for x in arr:
        if x > max_val:
            max_val = x
    return max_val
`
  },
  "O(1)": {
    name: "Constant Time (Noise Test)",
    theoretical: { o: "O(1)", theta: "\\Theta(1)", omega: "\\Omega(1)" },
    code: `def generate_input(n):
    return [0]*n

def target_function(arr):
    return len(arr)
`
  },
  "O(n)": {
    name: "Linear Search",
    theoretical: { o: "O(n)", theta: "\\Theta(n)", omega: "\\Omega(1)" },
    code: `import random

def generate_input(n):
    return [random.randint(0, 1000) for _ in range(n)]

def target_function(arr):
    target = -1 # Worst case: element not in array
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1
`
  },
  "O(n^2)": {
    name: "Bubble Sort",
    theoretical: { o: "O(n^2)", theta: "\\Theta(n^2)", omega: "\\Omega(n)" },
    code: `import random

def generate_input(n):
    # Reverse sorted array for worst-case
    return list(range(n, 0, -1))

def target_function(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr
`
  }
};

const formatTime = (ns) => {
  if (ns < 1000) return `${ns} ns`;
  if (ns < 1000000) return `${(ns / 1000).toFixed(2)} μs`;
  return `${(ns / 1000000).toFixed(2)} ms`;
};

export default function App() {
  const [template, setTemplate] = useState("manual");
  const [code, setCode] = useState(TEMPLATES["manual"].code);
  const [sizesStr, setSizesStr] = useState("10, 50, 100, 200, 500");
  const [targetFunc, setTargetFunc] = useState("target_function");
  const [generatorFunc, setGeneratorFunc] = useState("generate_input");
  
  const [manualO, setManualO] = useState("O(n)");
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [analysis, setAnalysis] = useState(null);

  const handleTemplateChange = (e) => {
    const t = e.target.value;
    setTemplate(t);
    setCode(TEMPLATES[t].code);
    setResults([]);
    setAnalysis(null);
  };

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setAnalysis(null);
    
    try {
      const sizes = sizesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      
      const response = await axios.post('http://127.0.0.1:8000/api/benchmark', {
        code,
        target_function: targetFunc,
        generator_function: generatorFunc,
        sizes
      });
      
      if (response.data.status === "error") {
        setError(response.data.error);
      } else {
        const rawData = response.data.data;
        const processedResults = rawData.map(r => ({
          ...r,
          displayTime: formatTime(r.time_ns),
          time_ms: r.time_ns / 1000000
        }));
        
        setResults(processedResults);
        
        // Run asymptotic analysis
        const emp = detectEmpiricalComplexity(processedResults);
        setAnalysis(emp);
      }
    } catch (err) {
      setError(err.message || "Failed to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  const theoretical = template === "manual" 
    ? { 
        o: manualO, 
        theta: analysis ? `\\Theta(${analysis.detected.replace('O(', '').replace(')', '')})` : "\\Theta(?)", 
        omega: analysis ? `\\Omega(${analysis.detected.replace('O(', '').replace(')', '')})` : "\\Omega(?)" 
      } 
    : TEMPLATES[template].theoretical;

  const isMatch = analysis && theoretical && analysis.detected === theoretical.o;
  
  // Export theoretical function for drawing
  const getTheoreticalFn = (notation) => {
    if (!notation) return null;
    // Map notation string like "O(n^2)" to our functions
    // Our analysis provides the empirical best, but we want the theoretical
    const match = analysis?.scores?.find(s => s.notation === notation);
    if (match) return match;
    // Fallback to empirical best if we can't match string exactly
    return { fn: analysis?.bestFn, rawC: analysis?.bestC };
  };

  const theoFnData = getTheoreticalFn(theoretical?.o);

  const theoreticalData = {
    fn: theoFnData?.fn,
    c: theoFnData?.rawC
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">
          <Activity color="var(--accent)" size={24} />
          <h1>AlgoBench</h1>
        </div>
      </header>

      <main className="main-content">
        <div className="pane">
          <CodeEditor code={code} onChange={setCode} />
        </div>

        <div className="pane glass">
          <div className="config-panel">
            <h2>Configuration</h2>
            <div className="controls">
              
              <div className="input-group full-width">
                <label>Algorithm Template</label>
                <select 
                  className="template-select"
                  value={template} 
                  onChange={handleTemplateChange}
                >
                  {Object.entries(TEMPLATES).map(([k, v]) => (
                    <option key={k} value={k}>{v.name}</option>
                  ))}
                </select>
              </div>

              {template === "manual" && (
                <div className="input-group">
                  <label>Expected Big-O (e.g. O(n))</label>
                  <input 
                    type="text" 
                    value={manualO} 
                    onChange={(e) => setManualO(e.target.value)} 
                  />
                </div>
              )}

              <div className={template === "manual" ? "input-group" : "input-group full-width"}>
                <label>Input Sizes (comma separated)</label>
                <input 
                  type="text" 
                  value={sizesStr} 
                  onChange={(e) => setSizesStr(e.target.value)} 
                  placeholder="e.g. 10, 100, 1000"
                />
              </div>
              
              <button 
                className="primary-btn" 
                onClick={handleRun}
                disabled={loading}
              >
                <Play size={18} />
                {loading ? 'Running...' : 'Run Benchmark'}
              </button>
            </div>

            {error && (
              <div className="error-msg">
                <strong>Execution Error:</strong><br/>{error}
              </div>
            )}
          </div>

          <div className="results-panel">
            <h2>Execution Time Analysis</h2>
            <div className="chart-container">
              <ResultsChart data={results} theoreticalData={theoreticalData} />
            </div>
          </div>
          
          <ComplexityInfo 
            theoretical={theoretical} 
            empiricalMatch={isMatch} 
            confidenceWarning={analysis?.confidenceWarning}
          />
          
          {loading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Executing algorithm...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
