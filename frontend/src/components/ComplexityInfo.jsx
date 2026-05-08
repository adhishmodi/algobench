import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { Info } from 'lucide-react';

const TooltipGraph = ({ type }) => {
  // Simple CSS-based mini graphs for the tooltips
  return (
    <div className="mini-graph-container">
      <div className="mini-graph">
        {type === 'O' && <svg viewBox="0 0 100 100"><path d="M 10 90 Q 50 90, 90 10" stroke="red" fill="transparent" strokeWidth="3"/><path d="M 10 90 L 90 50" stroke="white" strokeDasharray="4" fill="transparent" strokeWidth="2" opacity="0.5"/></svg>}
        {type === 'Theta' && <svg viewBox="0 0 100 100"><path d="M 10 90 L 90 10" stroke="yellow" fill="transparent" strokeWidth="3"/><path d="M 10 90 L 90 10" stroke="white" strokeDasharray="4" fill="transparent" strokeWidth="2" opacity="0.5"/></svg>}
        {type === 'Omega' && <svg viewBox="0 0 100 100"><path d="M 10 90 Q 90 90, 90 50" stroke="green" fill="transparent" strokeWidth="3"/><path d="M 10 90 L 90 10" stroke="white" strokeDasharray="4" fill="transparent" strokeWidth="2" opacity="0.5"/></svg>}
      </div>
      <p className="graph-label">
        {type === 'O' && "Upper Bound (Worst-case)"}
        {type === 'Theta' && "Tight Bound (Exact growth)"}
        {type === 'Omega' && "Lower Bound (Best-case)"}
      </p>
    </div>
  );
};

export default function ComplexityInfo({ theoretical, empiricalMatch, confidenceWarning }) {
  if (!theoretical) return null;

  return (
    <div className="complexity-card glass">
      <div className="complexity-header">
        <h3>Theoretical Complexity</h3>
        {empiricalMatch && (
          <div className="match-badge">
            <div className="pulse-dot"></div>
            <span>Mathematical Match</span>
          </div>
        )}
      </div>
      
      {confidenceWarning && (
        <div className="confidence-warning">
          <strong>Insight:</strong> {confidenceWarning}
        </div>
      )}

      <div className="notations-grid">
        <div className="notation-item">
          <div className="notation-label">
            <span>Big-O</span>
            <div className="tooltip-trigger">
              <Info size={14} />
              <div className="tooltip-content"><TooltipGraph type="O" /></div>
            </div>
          </div>
          <div className="notation-value">
            <InlineMath math={theoretical.o} />
          </div>
        </div>

        <div className="notation-item">
          <div className="notation-label">
            <span>Big-Theta</span>
            <div className="tooltip-trigger">
              <Info size={14} />
              <div className="tooltip-content"><TooltipGraph type="Theta" /></div>
            </div>
          </div>
          <div className="notation-value">
            <InlineMath math={theoretical.theta} />
          </div>
        </div>

        <div className="notation-item">
          <div className="notation-label">
            <span>Big-Omega</span>
            <div className="tooltip-trigger">
              <Info size={14} />
              <div className="tooltip-content"><TooltipGraph type="Omega" /></div>
            </div>
          </div>
          <div className="notation-value">
            <InlineMath math={theoretical.omega} />
          </div>
        </div>
      </div>
    </div>
  );
}
