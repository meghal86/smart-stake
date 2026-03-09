import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuardianEnhanced } from '@/pages/GuardianEnhanced';

const {
  useGuardianScanMock,
  requestGuardianScanMock,
  toastSuccessMock,
  toastWarningMock,
  toastErrorMock,
  toastInfoMock,
  setActiveWalletMock,
  refetchMock,
  rescanMock,
  registryWallets,
  walletContextState,
} = vi.hoisted(() => {
  const setActiveWalletMock = vi.fn();
  const wallets = [
    {
      id: 'wallet-1',
      address: '0x1111111111111111111111111111111111111111',
      label: 'Primary Wallet',
      chain_namespace: 'eip155:1',
      guardian_scores: { 'eip155:1': 82 },
    },
    {
      id: 'wallet-2',
      address: '0x2222222222222222222222222222222222222222',
      label: 'Treasury Wallet',
      chain_namespace: 'eip155:1',
      guardian_scores: { 'eip155:1': 74 },
    },
  ];

  return {
    useGuardianScanMock: vi.fn(),
    requestGuardianScanMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    toastWarningMock: vi.fn(),
    toastErrorMock: vi.fn(),
    toastInfoMock: vi.fn(),
    setActiveWalletMock,
    refetchMock: vi.fn(),
    rescanMock: vi.fn(),
    registryWallets: wallets,
    walletContextState: {
      activeWallet: wallets[0].address,
      setActiveWallet: setActiveWalletMock,
    },
  };
});

vi.mock('framer-motion', async () => {
  const ReactModule = await import('react');
  const motionPropNames = new Set([
    'animate',
    'initial',
    'exit',
    'transition',
    'variants',
    'layoutId',
    'layout',
    'whileHover',
    'whileTap',
    'whileInView',
    'viewport',
  ]);
  const MotionComponent = ReactModule.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => {
    const domProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !motionPropNames.has(key))
    );

    return (
      <div ref={ref as any} {...domProps}>
        {children}
      </div>
    );
  });

  return {
    motion: new Proxy(
      {},
      {
        get: () => MotionComponent,
      }
    ),
  };
});

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: any) => children({ openConnectModal: vi.fn() }),
  },
  getDefaultConfig: vi.fn(),
}));

vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: registryWallets[0].address,
    isConnected: true,
    chain: { id: 1 },
  }),
}));

vi.mock('@/hooks/useGuardianScan', () => ({
  useGuardianScan: (...args: any[]) => useGuardianScanMock(...args),
}));

vi.mock('@/hooks/useWalletRegistry', () => ({
  useWalletRegistry: () => ({
    wallets: registryWallets,
  }),
}));

vi.mock('@/config/wagmi', () => ({
  chainIdToName: {
    1: 'ethereum',
  },
}));

vi.mock('@/contexts/WalletContext', () => ({
  useWallet: () => walletContextState,
}));

vi.mock('@/contexts/UserModeContext', () => ({
  useUserModeContext: () => ({
    mode: 'expert',
    setMode: vi.fn(),
    isBeginner: false,
    isExpert: true,
  }),
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotificationContext: () => ({}),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    actualTheme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/services/guardianService', async () => {
  const actual = await vi.importActual<typeof import('@/services/guardianService')>('@/services/guardianService');
  return {
    ...actual,
    requestGuardianScan: requestGuardianScanMock,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    warning: toastWarningMock,
    error: toastErrorMock,
    info: toastInfoMock,
  },
}));

vi.mock('@/components/layout/FooterNav', () => ({
  FooterNav: () => null,
}));

vi.mock('@/components/guardian/AddWalletModal', () => ({
  default: () => null,
}));

vi.mock('@/components/guardian/RisksTab', () => ({
  RisksTab: () => <div>Risks tab</div>,
}));

vi.mock('@/components/guardian/AlertsTab', () => ({
  AlertsTab: () => <div>Alerts tab</div>,
}));

vi.mock('@/components/guardian/HistoryTab', () => ({
  HistoryTab: () => <div>History tab</div>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/disabled-tooltip-button', () => ({
  DisabledTooltipButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/interactive-div', () => ({
  InteractiveDiv: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe('GuardianEnhanced Phase 1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('guardian_onboard_seen', '1');

    useGuardianScanMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Guardian scan is currently unavailable.'),
      refetch: refetchMock,
      rescan: rescanMock,
      isRescanning: false,
      isRefetching: false,
      statusAccent: '',
      scoreGlow: '',
    });

    requestGuardianScanMock.mockResolvedValue({
      trustScorePercent: 84,
      trustScoreRaw: 0.84,
      riskScore: 2,
      riskLevel: 'Low',
      statusLabel: 'Trusted',
      statusTone: 'trusted',
      flags: [],
      scannedAt: '2026-03-05T12:00:00.000Z',
      dataSource: 'live',
    });
  });

  it('shows a truthful error banner when live scan data is unavailable', () => {
    render(<GuardianEnhanced />);

    expect(screen.getByText('Guardian scan unavailable')).toBeInTheDocument();
    expect(screen.getByText('Guardian scan is currently unavailable.')).toBeInTheDocument();
    expect(screen.getAllByText('Scan required').length).toBeGreaterThan(0);
  });

  it('uses deterministic demo data when demo mode is explicitly enabled', async () => {
    const user = userEvent.setup();

    render(<GuardianEnhanced />);

    await user.click(screen.getByRole('button', { name: /enter demo mode/i }));

    expect(screen.queryByText('Guardian scan unavailable')).not.toBeInTheDocument();
    expect(screen.getAllByText('DEMO DATA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('78').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText((text) => text === 'Moderate Risk' || text === 'A little attention helps').length
    ).toBeGreaterThan(0);
  });

  it('switches the Guardian overview sub-tabs and updates the main content', async () => {
    const user = userEvent.setup();

    useGuardianScanMock.mockReturnValue({
      data: {
        trustScorePercent: 82,
        trustScoreRaw: 0.82,
        riskScore: 2,
        riskLevel: 'Low',
        statusLabel: 'Trusted',
        statusTone: 'trusted',
        confidence: 0.91,
        approvals: [
          { spender: '0xabc', severity: 'high' },
          { spender: '0xdef', severity: 'low' },
        ],
        flags: [
          { type: 'approval_risk' },
          { type: 'mixer_exposure' },
        ],
        scannedAt: '2026-03-05T11:55:00.000Z',
        dataSource: 'live',
      },
      isLoading: false,
      error: null,
      refetch: refetchMock,
      rescan: rescanMock,
      isRescanning: false,
      isRefetching: false,
      statusAccent: '',
      scoreGlow: '',
    });

    render(<GuardianEnhanced />);

    expect(screen.getByText('Wallet Health')).toBeInTheDocument();
    expect(screen.getByText('Health Trend')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /switch guardian overview to health/i }));

    expect(screen.getByText('Health trajectory')).toBeInTheDocument();
    expect(screen.getByText('How sure Guardian is')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /switch guardian overview to exposure/i }));

    expect(screen.getByText('Exposure Read')).toBeInTheDocument();
    expect(screen.getByText('Contracts with spending access')).toBeInTheDocument();
  });

  it('scans every wallet from the live wallet list when scan all is requested', async () => {
    const user = userEvent.setup();

    useGuardianScanMock.mockReturnValue({
      data: {
        trustScorePercent: 82,
        trustScoreRaw: 0.82,
        riskScore: 2,
        riskLevel: 'Low',
        statusLabel: 'Trusted',
        statusTone: 'trusted',
        flags: [],
        scannedAt: '2026-03-05T11:55:00.000Z',
        dataSource: 'live',
      },
      isLoading: false,
      error: null,
      refetch: refetchMock,
      rescan: rescanMock,
      isRescanning: false,
      isRefetching: false,
      statusAccent: '',
      scoreGlow: '',
    });

    render(<GuardianEnhanced />);

    await user.click(screen.getByRole('button', { name: /scan all 2 wallets for security risks/i }));

    await waitFor(() => {
      expect(requestGuardianScanMock).toHaveBeenCalledTimes(2);
    });

    expect(requestGuardianScanMock).toHaveBeenNthCalledWith(1, {
      walletAddress: registryWallets[0].address,
      network: 'ethereum',
    });
    expect(requestGuardianScanMock).toHaveBeenNthCalledWith(2, {
      walletAddress: registryWallets[1].address,
      network: 'ethereum',
    });
  });
});
