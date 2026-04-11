import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { StaffOrder } from '../types/orders';
import { OrdersScreen } from './OrdersScreen';

const mockUseQuery = jest.fn();
const mockNavigate = jest.fn();
const mockPlayOrderRingtone = jest.fn();
let mockAppStateCurrentState: 'active' | 'background' | 'inactive' | null = 'active';
const mockAppStateRemove = jest.fn();
let mockAppStateChangeListener:
  | ((nextState: 'active' | 'background' | 'inactive') => void)
  | undefined;

jest.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('react-native/Libraries/AppState/AppState', () => ({
  __esModule: true,
  default: {
    get currentState() {
      return mockAppStateCurrentState;
    },
    addEventListener: jest.fn((_, listener) => {
      mockAppStateChangeListener = listener;
      return {
        remove: mockAppStateRemove,
      };
    }),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../lib/convexApi', () => ({
  api: {
    orders: {
      listBoardOrders: { _reference: 'orders.listBoardOrders' },
    },
  },
}));

jest.mock('../lib/ringtone', () => ({
  playOrderRingtone: (...args: unknown[]) => mockPlayOrderRingtone(...args),
}));

function createOrder(overrides: Partial<StaffOrder>): StaffOrder {
  return {
    _id: 'order-1',
    customerName: 'Blueprint Tester',
    serviceType: 'dine-in',
    paymentMethodName: 'Cash',
    items: [{ lineItemId: 'item-1', name: 'Latte', quantity: 1 }],
    total: 180,
    status: 'pending',
    submittedAt: 1710000000000,
    ...overrides,
  };
}

describe('OrdersScreen', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockNavigate.mockReset();
    mockPlayOrderRingtone.mockReset();
    mockAppStateCurrentState = 'active';
    mockAppStateRemove.mockReset();
    mockAppStateChangeListener = undefined;
  });

  it('shows pending orders by default', () => {
    mockUseQuery.mockReturnValue([
      createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
      createOrder({ _id: 'order-preparing', customerName: 'Bea', status: 'preparing' }),
    ]);

    render(<OrdersScreen />);

    expect(screen.getByRole('tab', { name: 'Pending' })).toHaveAccessibilityState({
      selected: true,
    });
    expect(screen.getByText('Ari')).toBeTruthy();
    expect(screen.queryByText('Bea')).toBeNull();
  });

  it('filters visible rows when switching tabs', () => {
    mockUseQuery.mockReturnValue([
      createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
      createOrder({ _id: 'order-preparing', customerName: 'Bea', status: 'preparing' }),
      createOrder({ _id: 'order-ready', customerName: 'Cole', status: 'ready' }),
    ]);

    render(<OrdersScreen />);

    fireEvent.press(screen.getByRole('tab', { name: 'Preparing' }));
    expect(screen.getByText('Bea')).toBeTruthy();
    expect(screen.queryByText('Ari')).toBeNull();
    expect(screen.queryByText('Cole')).toBeNull();

    fireEvent.press(screen.getByRole('tab', { name: 'Ready' }));
    expect(screen.getByText('Cole')).toBeTruthy();
    expect(screen.queryByText('Ari')).toBeNull();
  });

  it('shows canceled orders when the canceled tab is selected', () => {
    mockUseQuery.mockReturnValue([
      createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
      createOrder({ _id: 'order-canceled', customerName: 'Mina', status: 'canceled' }),
    ]);

    render(<OrdersScreen />);

    fireEvent.press(screen.getByRole('tab', { name: 'Canceled' }));

    expect(screen.getByText('Mina')).toBeTruthy();
    expect(screen.queryByText('Ari')).toBeNull();
  });

  it('shows the redesigned empty-state copy for the selected tab', () => {
    mockUseQuery.mockReturnValue([]);

    render(<OrdersScreen />);

    expect(screen.getByText('No pending orders right now.')).toBeTruthy();
  });

  it('ignores undefined query state and does not ring on the first defined result', () => {
    mockUseQuery
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([
        createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
      ]);

    const { rerender } = render(<OrdersScreen />);

    expect(screen.getByText('Loading orders...')).toBeTruthy();

    rerender(<OrdersScreen />);

    expect(mockPlayOrderRingtone).not.toHaveBeenCalled();
  });

  it('stays silent for later updates while the app is backgrounded', () => {
    mockAppStateCurrentState = 'background';
    mockUseQuery
      .mockReturnValueOnce([
        createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
      ])
      .mockReturnValueOnce([
        createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
        createOrder({ _id: 'order-2', customerName: 'Bea', status: 'pending' }),
      ]);

    const { rerender } = render(<OrdersScreen />);

    rerender(<OrdersScreen />);

    expect(mockPlayOrderRingtone).not.toHaveBeenCalled();
  });

  it('does not ring for orders that arrived while backgrounded after returning to foreground', () => {
    let currentOrders = [
      createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
    ];
    mockUseQuery.mockImplementation(() => currentOrders);

    const { rerender } = render(<OrdersScreen />);

    act(() => {
      mockAppStateChangeListener?.('background');
    });
    currentOrders = [
      createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
      createOrder({ _id: 'order-2', customerName: 'Bea', status: 'pending' }),
    ];
    rerender(<OrdersScreen />);
    expect(mockPlayOrderRingtone).not.toHaveBeenCalled();

    act(() => {
      mockAppStateChangeListener?.('active');
    });
    currentOrders = [
      createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
      createOrder({ _id: 'order-2', customerName: 'Bea', status: 'pending' }),
    ];
    rerender(<OrdersScreen />);
    expect(mockPlayOrderRingtone).not.toHaveBeenCalled();

    currentOrders = [
      createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
      createOrder({ _id: 'order-2', customerName: 'Bea', status: 'pending' }),
      createOrder({ _id: 'order-3', customerName: 'Cole', status: 'pending' }),
    ];
    rerender(<OrdersScreen />);
    expect(mockPlayOrderRingtone).toHaveBeenCalledTimes(1);
  });

  it('plays a ringtone when one new order appears after the initial load', () => {
    mockUseQuery
      .mockReturnValueOnce([
        createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
      ])
      .mockReturnValueOnce([
        createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
        createOrder({ _id: 'order-2', customerName: 'Bea', status: 'pending' }),
      ]);

    const { rerender } = render(<OrdersScreen />);

    rerender(<OrdersScreen />);

    expect(mockPlayOrderRingtone).toHaveBeenCalledTimes(1);
  });

  it('plays one ringtone per new order when multiple orders appear together', () => {
    mockUseQuery
      .mockReturnValueOnce([
        createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
      ])
      .mockReturnValueOnce([
        createOrder({ _id: 'order-1', customerName: 'Ari', status: 'pending' }),
        createOrder({ _id: 'order-2', customerName: 'Bea', status: 'pending' }),
        createOrder({ _id: 'order-3', customerName: 'Cole', status: 'pending' }),
      ]);

    const { rerender } = render(<OrdersScreen />);

    rerender(<OrdersScreen />);

    expect(mockPlayOrderRingtone).toHaveBeenCalledTimes(2);
  });

  it('navigates to order detail with order id when a row is pressed', () => {
    mockUseQuery.mockReturnValue([
      createOrder({ _id: 'order-pending', customerName: 'Ari', status: 'pending' }),
    ]);

    render(<OrdersScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Open order Ari' }));

    expect(mockNavigate).toHaveBeenCalledWith('OrderDetail', {
      orderId: 'order-pending',
    });
  });
});

describe('triggerOrderAlert', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('triggers vibration, notification scheduling, and ringtone playback for one alert', async () => {
    const play = jest.fn();
    const seekTo = jest.fn().mockResolvedValue(undefined);
    const addListener = jest.fn((_, listener: (status: { didJustFinish: boolean }) => void) => {
      queueMicrotask(() => listener({ didJustFinish: true }));
      return { remove: jest.fn() };
    });
    const createAudioPlayer = jest.fn(() => ({
      play,
      seekTo,
      addListener,
      remove: jest.fn(),
    }));
    const setAudioModeAsync = jest.fn().mockResolvedValue(undefined);
    const setIsAudioActiveAsync = jest.fn().mockResolvedValue(undefined);
    const setNotificationHandler = jest.fn();
    const setNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
    const scheduleNotificationAsync = jest.fn().mockRejectedValueOnce(new Error('failed to schedule'));
    const vibrate = jest.fn();

    jest.doMock('expo-audio', () => ({
      createAudioPlayer,
      setAudioModeAsync,
      setIsAudioActiveAsync,
    }));
    jest.doMock('expo-notifications', () => ({
      AndroidImportance: { MAX: 'max' },
      setNotificationHandler,
      setNotificationChannelAsync,
      scheduleNotificationAsync,
    }));
    jest.doMock('react-native', () => ({
      Vibration: { vibrate },
    }));
    jest.unmock('../lib/ringtone');

    const { triggerOrderAlert } = require('../lib/ringtone') as typeof import('../lib/ringtone');

    await expect(triggerOrderAlert()).resolves.toBeUndefined();

    expect(vibrate).toHaveBeenCalledWith(500);
    expect(scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'New order received',
        body: 'Open staff orders to review it.',
        sound: null,
      },
      trigger: null,
    });
    expect(seekTo).toHaveBeenCalledWith(0);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('queues multiple alerts and configures notification setup once', async () => {
    const seekTo = jest.fn().mockResolvedValue(undefined);
    const play = jest.fn();
    const setNotificationHandler = jest.fn();
    const setNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
    const scheduleNotificationAsync = jest.fn().mockResolvedValue('notif-id');
    const vibrate = jest.fn();

    jest.doMock('expo-audio', () => ({
      createAudioPlayer: () => ({
        seekTo,
        play,
        addListener: jest.fn((_, listener: (status: { didJustFinish: boolean }) => void) => {
          queueMicrotask(() => listener({ didJustFinish: true }));
          return { remove: jest.fn() };
        }),
        remove: jest.fn(),
      }),
      setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
      setIsAudioActiveAsync: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock('expo-notifications', () => ({
      AndroidImportance: { MAX: 'max' },
      setNotificationHandler,
      setNotificationChannelAsync,
      scheduleNotificationAsync,
    }));
    jest.doMock('react-native', () => ({
      Vibration: { vibrate },
    }));
    jest.unmock('../lib/ringtone');

    const { triggerOrderAlert } = require('../lib/ringtone') as typeof import('../lib/ringtone');

    await triggerOrderAlert();
    await triggerOrderAlert();

    expect(setNotificationHandler).toHaveBeenCalledTimes(1);
    expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('continues with vibration and ringtone when notification setup fails', async () => {
    const seekTo = jest.fn().mockResolvedValue(undefined);
    const play = jest.fn();
    const addListener = jest.fn((_, listener: (status: { didJustFinish: boolean }) => void) => {
      queueMicrotask(() => listener({ didJustFinish: true }));
      return { remove: jest.fn() };
    });
    const createAudioPlayer = jest.fn(() => ({
      seekTo,
      play,
      addListener,
      remove: jest.fn(),
    }));
    const setAudioModeAsync = jest.fn().mockResolvedValue(undefined);
    const setIsAudioActiveAsync = jest.fn().mockResolvedValue(undefined);
    const setNotificationHandler = jest.fn();
    const setNotificationChannelAsync = jest.fn().mockRejectedValueOnce(new Error('channel failed'));
    const scheduleNotificationAsync = jest.fn().mockResolvedValue('notif-1');
    const vibrate = jest.fn();

    jest.doMock('expo-audio', () => ({
      createAudioPlayer,
      setAudioModeAsync,
      setIsAudioActiveAsync,
    }));
    jest.doMock('expo-notifications', () => ({
      AndroidImportance: { MAX: 'max' },
      setNotificationHandler,
      setNotificationChannelAsync,
      scheduleNotificationAsync,
    }));
    jest.doMock('react-native', () => ({
      Vibration: { vibrate },
    }));
    jest.unmock('../lib/ringtone');

    const { triggerOrderAlert } = require('../lib/ringtone') as typeof import('../lib/ringtone');

    await expect(triggerOrderAlert()).resolves.toBeUndefined();

    expect(setNotificationHandler).toHaveBeenCalledTimes(1);
    expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(500);
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(seekTo).toHaveBeenCalledWith(0);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('retries audio setup after a transient failure', async () => {
    const play = jest.fn();
    const seekTo = jest.fn().mockResolvedValue(undefined);
    const addListener = jest.fn((_, listener: (status: { didJustFinish: boolean }) => void) => {
      queueMicrotask(() => listener({ didJustFinish: true }));
      return { remove: jest.fn() };
    });
    const createAudioPlayer = jest.fn(() => ({
      play,
      seekTo,
      addListener,
      remove: jest.fn(),
    }));
    const setAudioModeAsync = jest
      .fn()
      .mockRejectedValueOnce(new Error('audio setup failed'))
      .mockResolvedValue(undefined);
    const setIsAudioActiveAsync = jest.fn().mockResolvedValue(undefined);
    const setNotificationHandler = jest.fn();
    const setNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
    const scheduleNotificationAsync = jest.fn().mockResolvedValue('notif-1');
    const vibrate = jest.fn();

    jest.doMock('expo-audio', () => ({
      createAudioPlayer,
      setAudioModeAsync,
      setIsAudioActiveAsync,
    }));
    jest.doMock('expo-notifications', () => ({
      AndroidImportance: { MAX: 'max' },
      setNotificationHandler,
      setNotificationChannelAsync,
      scheduleNotificationAsync,
    }));
    jest.doMock('react-native', () => ({
      Vibration: { vibrate },
    }));
    jest.unmock('../lib/ringtone');

    const { triggerOrderAlert } = require('../lib/ringtone') as typeof import('../lib/ringtone');

    await expect(triggerOrderAlert()).rejects.toThrow('audio setup failed');
    await expect(triggerOrderAlert()).resolves.toBeUndefined();

    expect(setAudioModeAsync).toHaveBeenCalledTimes(2);
    expect(setIsAudioActiveAsync).toHaveBeenCalledTimes(1);
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('resolves when playback reports didJustFinish before the fallback timeout', async () => {
    let playbackStatusListener: ((status: { didJustFinish: boolean }) => void) | undefined;
    const remove = jest.fn();
    const play = jest.fn();
    const seekTo = jest.fn().mockResolvedValue(undefined);
    const setAudioModeAsync = jest.fn().mockResolvedValue(undefined);
    const setIsAudioActiveAsync = jest.fn().mockResolvedValue(undefined);
    const createAudioPlayer = jest.fn(() => ({
      play,
      seekTo,
      addListener,
      remove: jest.fn(),
    }));
    const addListener = jest.fn((eventName: string, listener: typeof playbackStatusListener) => {
      expect(eventName).toBe('playbackStatusUpdate');
      playbackStatusListener = listener;
      return { remove };
    });

    jest.doMock('expo-audio', () => ({
      createAudioPlayer,
      setAudioModeAsync,
      setIsAudioActiveAsync,
    }));
    jest.unmock('../lib/ringtone');

    const { triggerOrderAlert } = require('../lib/ringtone') as typeof import('../lib/ringtone');

    const playback = triggerOrderAlert();

    await waitFor(() => {
      expect(addListener).toHaveBeenCalledTimes(1);
    });
    playbackStatusListener?.({ didJustFinish: true });
    await expect(playback).resolves.toBeUndefined();

    expect(setAudioModeAsync).toHaveBeenCalledWith({
      interruptionMode: 'mixWithOthers',
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
    expect(setIsAudioActiveAsync).toHaveBeenCalledWith(true);
    expect(createAudioPlayer).toHaveBeenCalledWith(
      expect.anything(),
      { downloadFirst: true, keepAudioSessionActive: true, updateInterval: 100 },
    );
    expect(seekTo).toHaveBeenCalledWith(0);
    expect(play).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('settles even if playback never reports didJustFinish', async () => {
    const remove = jest.fn();
    const play = jest.fn();
    const seekTo = jest.fn().mockResolvedValue(undefined);
    const addListener = jest.fn(() => ({
      remove,
    }));
    const setAudioModeAsync = jest.fn().mockResolvedValue(undefined);
    const setIsAudioActiveAsync = jest.fn().mockResolvedValue(undefined);
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(((callback) => {
      callback();
      return 0 as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);

    try {
      jest.doMock('expo-audio', () => ({
        setAudioModeAsync,
        setIsAudioActiveAsync,
        createAudioPlayer: () => ({
          play,
          seekTo,
          addListener,
          remove: jest.fn(),
        }),
      }));
      jest.unmock('../lib/ringtone');

      const { triggerOrderAlert } = require('../lib/ringtone') as typeof import('../lib/ringtone');

      const playback = triggerOrderAlert();

      await Promise.resolve();
      await Promise.resolve();

      await expect(playback).resolves.toBeUndefined();
      expect(seekTo).toHaveBeenCalledWith(0);
      expect(play).toHaveBeenCalledTimes(1);
      expect(addListener).toHaveBeenCalledWith(
        'playbackStatusUpdate',
        expect.any(Function),
      );
      expect(remove).toHaveBeenCalledTimes(1);
    } finally {
      setTimeoutSpy.mockRestore();
    }
  });

  it('reuses a single player across multiple ringtone plays', async () => {
    const setAudioModeAsync = jest.fn().mockResolvedValue(undefined);
    const setIsAudioActiveAsync = jest.fn().mockResolvedValue(undefined);
    const seekTo = jest.fn().mockResolvedValue(undefined);
    const play = jest.fn();
    const remove = jest.fn();
    const createAudioPlayer = jest.fn(() => ({
      seekTo,
      play,
      remove,
      addListener: jest.fn((_, listener: (status: { didJustFinish: boolean }) => void) => {
        queueMicrotask(() => listener({ didJustFinish: true }));
        return { remove: jest.fn() };
      }),
    }));

    jest.doMock('expo-audio', () => ({
      createAudioPlayer,
      setAudioModeAsync,
      setIsAudioActiveAsync,
    }));
    jest.unmock('../lib/ringtone');

    const { triggerOrderAlert } = require('../lib/ringtone') as typeof import('../lib/ringtone');

    await triggerOrderAlert();
    await triggerOrderAlert();

    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(seekTo).toHaveBeenCalledTimes(2);
    expect(play).toHaveBeenCalledTimes(2);
    expect(remove).not.toHaveBeenCalled();
  });
});
