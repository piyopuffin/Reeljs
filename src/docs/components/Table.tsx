import React from 'react';

interface TableProps {
  headers: string[];
  rows: string[][];
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  borderBottom: '2px solid #444',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #333',
};

/**
 * Simple table component for Storybook MDX.
 * Usage: <Table headers={['A','B']} rows={[['1','2'],['3','4']]} />
 */
export function Table({ headers, rows }: TableProps) {
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', margin: '16px 0', fontSize: 14 }}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} style={thStyle}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci} style={tdStyle}><code>{cell}</code></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
