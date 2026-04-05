import type { Meta, StoryObj } from '@storybook/react';
import { Symbol } from './Symbol';

const meta = {
  title: 'Components/Symbol',
  component: Symbol,
  tags: ['autodocs'],
  argTypes: {
    symbolId: { control: 'text' },
    highlighted: { control: 'boolean' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof Symbol>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    symbolId: 'cherry',
  },
};

export const Highlighted: Story = {
  args: {
    symbolId: 'cherry',
    highlighted: true,
  },
};

export const CustomRender: Story = {
  args: {
    symbolId: 'cherry',
    renderSymbol: (id: string) => <span style={{ fontSize: 32 }}>{id === 'cherry' ? '🍒' : id}</span>,
  },
};
