import React from 'react';

const STEPS = ['Business Details', 'Stakeholders', 'Milestones', 'Charges'];

export default function DealWizard({ activeStep, onStepChange, children }) {
  return (
    <div>
      {/* Step Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, background: '#F8FAFC', border: '1px solid #E1E8F4', borderRadius: 12, padding: '12px 20px' }}>
        {STEPS.map((step, i) => (
          <React.Fragment key={step}>
            <button
              onClick={() => onStepChange(i)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px',
                fontWeight: i === activeStep ? 800 : 500, fontSize: 13,
                color: i === activeStep ? '#4361EE' : i < activeStep ? '#10B981' : '#94A3B8',
                borderBottom: i === activeStep ? '2px solid #4361EE' : '2px solid transparent',
              }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: '50%', marginRight: 6, fontSize: 11, fontWeight: 800,
                background: i === activeStep ? '#4361EE' : i < activeStep ? '#10B981' : '#E1E8F4',
                color: i <= activeStep ? '#FFF' : '#94A3B8'
              }}>{i < activeStep ? '✓' : i + 1}</span>
              {step}
            </button>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: '#E1E8F4', margin: '0 4px' }} />}
          </React.Fragment>
        ))}
      </div>
      {/* Active step content */}
      {children}
    </div>
  );
}
