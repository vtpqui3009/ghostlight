import { useState } from 'react';
import type { Scenario, RunResult } from '../domain/types';

interface TimelineProps {
  scenario: Scenario;
  runResult: RunResult;
  selectedFrameIndex: number | null;
  onSelectFrame: (index: number | null) => void;
}

export function Timeline({ scenario, runResult, selectedFrameIndex, onSelectFrame }: TimelineProps) {
  const [expandedCues, setExpandedCues] = useState<Set<string>>(new Set(scenario.cues.map(c => c.id)));

  const toggleCue = (cueId: string) => {
    setExpandedCues(prev => {
      const next = new Set(prev);
      if (next.has(cueId)) {
        next.delete(cueId);
      } else {
        next.add(cueId);
      }
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, cueId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleCue(cueId);
    }
  };

  const handleActionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectFrame(selectedFrameIndex === index ? null : index);
    }
  };

  return (
    <div className="timeline" role="tree" aria-label="Cue timeline">
      {scenario.cues.map((cue) => {
        const isExpanded = expandedCues.has(cue.id);
        const cueFrames = runResult.frames.filter(f => f.cueId === cue.id);
        
        return (
          <div key={cue.id} className="cue-item" role="treeitem" aria-expanded={isExpanded}>
            <div
              className="cue-header"
              onClick={() => toggleCue(cue.id)}
              onKeyDown={(e) => handleKeyDown(e, cue.id)}
              tabIndex={0}
              role="button"
            >
              <span className="cue-expand-icon" aria-hidden="true">
                {isExpanded ? '▼' : '▶'}
              </span>
              <span>{cue.title}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-mid)' }}>
                {cueFrames.length} {cueFrames.length === 1 ? 'action' : 'actions'}
              </span>
            </div>

            {isExpanded && cueFrames.length > 0 && (
              <ul className="action-list" role="group">
                {cueFrames.map((frame) => {
                  const prop = scenario.props.find(p => p.id === frame.action.propId);
                  const status = frame.issues.length > 0 
                    ? (frame.issues[0].severity === 'uncertain' ? 'uncertain' : 'rejected')
                    : 'applied';
                  const isSelected = selectedFrameIndex === frame.index;

                  return (
                    <li
                      key={frame.index}
                      className={`action-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => onSelectFrame(frame.index)}
                      onKeyDown={(e) => handleActionKeyDown(e, frame.index)}
                      tabIndex={0}
                      role="treeitem"
                      aria-selected={isSelected}
                    >
                      {/* The accessible name is built from the visible text, plus this
                          status word, which is otherwise carried only by colour. An
                          aria-label here would contradict what is on screen. */}
                      <span className="sr-only">{status}. </span>
                      <div className={`action-status ${status}`} aria-hidden="true"></div>
                      <div className="action-label">
                        <div className="action-primary">
                          {frame.action.kind} {prop?.name || frame.action.propId}
                        </div>
                        <div className="action-secondary">
                          ID: {frame.action.propId}
                          {frame.issues.length > 0 && ` • ${frame.issues[0].code}`}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
      
      {scenario.cues.length === 0 && (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)' }}>No cues yet. Add cues in the Editor.</p>
        </div>
      )}
    </div>
  );
}
