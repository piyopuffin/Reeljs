import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let mermaidInitialized = false;

/**
 * Mermaid diagram renderer for Storybook MDX.
 * Uses a light background with dark text for consistent readability
 * regardless of the host page's dark/light mode.
 */
export function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        themeVariables: {
          // Force high-contrast colors for all diagram types
          primaryColor: '#4a90d9',
          primaryTextColor: '#1a1a1a',
          primaryBorderColor: '#2c5f9e',
          secondaryColor: '#e8f0fe',
          secondaryTextColor: '#1a1a1a',
          tertiaryColor: '#f0f4f8',
          tertiaryTextColor: '#1a1a1a',
          lineColor: '#555',
          textColor: '#1a1a1a',
          mainBkg: '#e8f0fe',
          nodeBorder: '#2c5f9e',
          clusterBkg: '#f5f7fa',
          titleColor: '#1a1a1a',
          edgeLabelBackground: '#ffffff',
          // State diagram
          labelColor: '#1a1a1a',
          altBackground: '#f0f4f8',
          // Sequence diagram
          actorBkg: '#4a90d9',
          actorTextColor: '#ffffff',
          actorBorder: '#2c5f9e',
          actorLineColor: '#555',
          signalColor: '#1a1a1a',
          signalTextColor: '#1a1a1a',
          noteBkgColor: '#fff9c4',
          noteTextColor: '#1a1a1a',
          noteBorderColor: '#e0c200',
          activationBkgColor: '#dbeafe',
          activationBorderColor: '#2c5f9e',
          // Flowchart
          nodeTextColor: '#1a1a1a',
        },
      });
      mermaidInitialized = true;
    }

    const render = async () => {
      try {
        const { svg: rendered } = await mermaid.render(idRef.current, chart.trim());
        setSvg(rendered);
      } catch {
        setSvg(`<pre style="color:red">Mermaid render error</pre>`);
      }
    };
    render();
  }, [chart]);

  return (
    <div
      ref={containerRef}
      style={{
        margin: '16px 0',
        overflow: 'auto',
        background: '#ffffff',
        borderRadius: 8,
        padding: 16,
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
