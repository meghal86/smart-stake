import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddWalletModal from '@/components/guardian/AddWalletModal';

const addWalletMock = vi.fn();
const updateWalletAliasMock = vi.fn();
const toastMock = vi.fn();
const openConnectModalMock = vi.fn();

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (args: { openConnectModal: () => void }) => JSX.Element }) =>
      children({ openConnectModal: openConnectModalMock }),
  },
}));

vi.mock('wagmi', () => ({
  useAccount: () => ({
    isConnected: false,
    address: undefined,
  }),
}));

vi.mock('@/contexts/WalletContext', () => ({
  useWalletContext: () => ({
    addWallet: addWalletMock,
    updateWalletAlias: updateWalletAliasMock,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

describe('AddWalletModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    addWalletMock.mockReset();
    updateWalletAliasMock.mockReset();
    toastMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a read-only wallet by address, updates alias, and triggers close after success animation', async () => {
    addWalletMock.mockResolvedValue({
      address: '0xabc123000000000000000000000000000000abcd',
      wallet_type: 'readonly',
      status: 'readonly',
      alias: null,
      ens_name: 'vitalik.eth',
    });

    updateWalletAliasMock.mockResolvedValue(undefined);

    const onClose = vi.fn();
    const onWalletAdded = vi.fn();

    render(<AddWalletModal isOpen onClose={onClose} onWalletAdded={onWalletAdded} />);

    const input = screen.getByPlaceholderText(/0x\.\.\. or ENS name/i);
    await userEvent.type(input, 'vitalik.eth');

    await userEvent.click(screen.getByRole('button', { name: /add wallet/i }));

    await waitFor(() => {
      expect(addWalletMock).toHaveBeenCalledWith({
        input: 'vitalik.eth',
        walletType: 'readonly',
        alias: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/add alias/i)).toHaveValue('vitalik.eth');
    });

    vi.advanceTimersByTime(600);

    await waitFor(() => {
      expect(updateWalletAliasMock).toHaveBeenCalledWith(
        '0xabc123000000000000000000000000000000abcd',
        'vitalik.eth',
      );
    });

    expect(onWalletAdded).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0xabc123000000000000000000000000000000abcd',
      }),
    );

    vi.advanceTimersByTime(1600);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('surfaces duplicate wallet errors returned by the backend', async () => {
    addWalletMock.mockRejectedValue(new Error('Wallet already added.'));
    const onClose = vi.fn();

    render(<AddWalletModal isOpen onClose={onClose} />);

    const input = screen.getByPlaceholderText(/0x\.\.\. or ENS name/i);
    await userEvent.type(input, 'duplicate.eth');
    await userEvent.click(screen.getByRole('button', { name: /add wallet/i }));

    await waitFor(() => {
      expect(addWalletMock).toHaveBeenCalledWith({
        input: 'duplicate.eth',
        walletType: 'readonly',
        alias: undefined,
      });
    });

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Wallet already added.',
          variant: 'destructive',
        }),
      );
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
