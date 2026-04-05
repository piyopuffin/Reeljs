import type { Meta, StoryObj } from '@storybook/react';
import { StopButton } from './StopButton';

const noopStop = (reelIndex: number, timing: number) => {
  console.log(`Stop reel ${reelIndex} at timing ${timing}`);
};

const meta = {
  title: 'Components/StopButton',
  component: StopButton,
  tags: ['autodocs'],
  argTypes: {
    reelIndex: { control: 'number' },
    disabled: { control: 'boolean' },
    className: { control: 'text' },
    'aria-label': { control: 'text' },
  },
} satisfies Meta<typeof StopButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    reelIndex: 0,
    disabled: false,
    onStop: noopStop,
  },
};

export const Disabled: Story = {
  args: {
    reelIndex: 0,
    disabled: true,
    onStop: noopStop,
  },
};

export const CustomLabel: Story = {
  args: {
    reelIndex: 1,
    disabled: false,
    onStop: noopStop,
    'aria-label': 'Stop reel 2',
  },
};
