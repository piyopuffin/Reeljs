import type { Meta, StoryObj } from '@storybook/react';
import { Reel } from './Reel';

const meta = {
  title: 'Components/Reel',
  component: Reel,
  tags: ['autodocs'],
  argTypes: {
    symbols: { control: 'object' },
    spinning: { control: 'boolean' },
    stopPosition: { control: 'number' },
    rowCount: { control: 'number' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof Reel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    symbols: ['cherry', 'bell', 'bar', 'seven', 'watermelon'],
    spinning: false,
    stopPosition: 0,
    rowCount: 3,
  },
};

export const Spinning: Story = {
  args: {
    symbols: ['cherry', 'bell', 'bar', 'seven', 'watermelon'],
    spinning: true,
    rowCount: 3,
  },
};

export const CustomPosition: Story = {
  args: {
    symbols: ['cherry', 'bell', 'bar', 'seven', 'watermelon'],
    spinning: false,
    stopPosition: 2,
    rowCount: 3,
  },
};
