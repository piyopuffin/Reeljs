import type { Meta, StoryObj } from '@storybook/react';
import { SlotMachine } from './SlotMachine';

const defaultSymbols = [
  { id: 'cherry', name: 'Cherry', weight: 10 },
  { id: 'bell', name: 'Bell', weight: 8 },
  { id: 'bar', name: 'Bar', weight: 5 },
  { id: 'seven', name: 'Seven', weight: 2 },
];

const meta = {
  title: 'Components/SlotMachine',
  component: SlotMachine,
  tags: ['autodocs'],
  argTypes: {
    reelCount: { control: { type: 'number', min: 1, max: 10 } },
    rowCount: { control: { type: 'number', min: 1, max: 5 } },
    showStopButtons: { control: 'boolean' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof SlotMachine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    symbols: defaultSymbols,
    reelCount: 3,
    rowCount: 3,
    showStopButtons: true,
  },
};

export const FiveReels: Story = {
  args: {
    symbols: defaultSymbols,
    reelCount: 5,
    rowCount: 3,
    showStopButtons: true,
  },
};

export const NoStopButtons: Story = {
  args: {
    symbols: defaultSymbols,
    reelCount: 3,
    rowCount: 3,
    showStopButtons: false,
  },
};

export const CustomLayout: Story = {
  args: {
    symbols: defaultSymbols,
    children: <div style={{ padding: 20, textAlign: 'center' }}>Custom Layout Content</div>,
  },
};
