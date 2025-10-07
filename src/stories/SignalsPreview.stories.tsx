import type { Meta, StoryObj } from '@storybook/react'
import SignalsPreview from '@/components/hub5/SignalsPreview.lite'

const meta: Meta<typeof SignalsPreview> = {
  title: 'Hub/SignalsPreview',
  component: SignalsPreview,
  parameters: { layout: 'padded' }
}
export default meta
type Story = StoryObj<typeof SignalsPreview>

export const Default: Story = {}
