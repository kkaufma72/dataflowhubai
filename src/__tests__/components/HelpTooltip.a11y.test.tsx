import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import HelpTooltip from '../../components/common/HelpTooltip';

describe('HelpTooltip accessibility', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = render(
      <HelpTooltip content="This is a helpful tooltip" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have any accessibility violations when tooltip is visible', async () => {
    // Mock useState to force tooltip to be visible
    vi.spyOn(React, 'useState').mockImplementationOnce(() => [true, vi.fn()]);
    
    const { container } = render(
      <HelpTooltip content="This is a helpful tooltip" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have any accessibility violations with different positions', async () => {
    const positions: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left'];
    
    for (const position of positions) {
      const { container } = render(
        <HelpTooltip content="This is a helpful tooltip" position={position} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should not have any accessibility violations with complex content', async () => {
    const { container } = render(
      <HelpTooltip 
        content={
          <div>
            <h3>Help Title</h3>
            <p>This is a paragraph of help text.</p>
            <ul>
              <li>List item 1</li>
              <li>List item 2</li>
            </ul>
          </div>
        } 
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});