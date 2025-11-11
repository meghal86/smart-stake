import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SearchBar } from '@/components/hunter/SearchBar';

// Mock timers for debouncing tests
vi.useFakeTimers();

describe('SearchBar', () => {
  const mockOnChange = vi.fn();
  const mockOnSuggestionClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
  });

  describe('Basic Rendering', () => {
    it('should render with default placeholder', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);
      
      expect(screen.getByPlaceholderText('Search opportunities...')).toBeInTheDocument();
      expect(screen.getByLabelText('Search opportunities')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          placeholder="Custom placeholder"
        />
      );
      
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      render(<SearchBar value="test query" onChange={mockOnChange} />);
      
      expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
    });

    it('should render search icon', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);
      
      const searchIcon = screen.getByRole('combobox').parentElement?.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<SearchBar value="" onChange={mockOnChange} disabled />);
      
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('Input Handling', () => {
    it('should update local value on input change', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(input).toHaveValue('test');
    });

    it('should sync local value with prop value', () => {
      const { rerender } = render(<SearchBar value="" onChange={mockOnChange} />);
      
      rerender(<SearchBar value="new value" onChange={mockOnChange} />);
      
      expect(screen.getByDisplayValue('new value')).toBeInTheDocument();
    });
  });

  describe('Debouncing (300ms)', () => {
    it('should debounce onChange calls by 300ms', () => {
      render(<SearchBar value="" onChange={mockOnChange} debounceMs={300} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      // Should not call onChange immediately
      expect(mockOnChange).not.toHaveBeenCalled();
      
      // Fast-forward time by 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      // Should call onChange after debounce
      expect(mockOnChange).toHaveBeenCalledWith('test');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should reset debounce timer on rapid typing', () => {
      render(<SearchBar value="" onChange={mockOnChange} debounceMs={300} />);
      
      const input = screen.getByRole('combobox');
      
      // Type first character
      fireEvent.change(input, { target: { value: 't' } });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      // Type second character before debounce completes
      fireEvent.change(input, { target: { value: 'te' } });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      // Type third character before debounce completes
      fireEvent.change(input, { target: { value: 'tes' } });
      
      // Should not have called onChange yet
      expect(mockOnChange).not.toHaveBeenCalled();
      
      // Complete the debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      // Should only call once with final value
      expect(mockOnChange).toHaveBeenCalledWith('tes');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should use custom debounce time', () => {
      render(<SearchBar value="" onChange={mockOnChange} debounceMs={500} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      // Should not call after 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(mockOnChange).not.toHaveBeenCalled();
      
      // Should call after 500ms
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(mockOnChange).toHaveBeenCalledWith('test');
    });
  });

  describe('Clear Functionality', () => {
    it('should show clear button when there is input', () => {
      render(<SearchBar value="test" onChange={mockOnChange} />);
      
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('should not show clear button when input is empty', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);
      
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('should clear input when clear button is clicked', () => {
      render(<SearchBar value="test" onChange={mockOnChange} />);
      
      const clearButton = screen.getByLabelText('Clear search');
      fireEvent.click(clearButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('');
      expect(screen.getByRole('combobox')).toHaveValue('');
    });

    it('should focus input after clearing', () => {
      render(<SearchBar value="test" onChange={mockOnChange} />);
      
      const clearButton = screen.getByLabelText('Clear search');
      fireEvent.click(clearButton);
      
      expect(screen.getByRole('combobox')).toHaveFocus();
    });

    it('should not show clear button when disabled', () => {
      render(<SearchBar value="test" onChange={mockOnChange} disabled />);
      
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });
  });

  describe('Search Suggestions', () => {
    const suggestions = ['Ethereum Staking', 'LayerZero Airdrop', 'Uniswap Quest'];

    it('should show suggestions when input has value', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={suggestions}
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      suggestions.forEach(suggestion => {
        expect(screen.getByText(suggestion)).toBeInTheDocument();
      });
    });

    it('should not show suggestions when input is empty', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={suggestions}
        />
      );
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should not show suggestions when suggestions array is empty', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={[]}
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should call onSuggestionClick when suggestion is clicked', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={suggestions}
          onSuggestionClick={mockOnSuggestionClick}
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      const suggestion = screen.getByText('Ethereum Staking');
      fireEvent.click(suggestion);
      
      expect(mockOnSuggestionClick).toHaveBeenCalledWith('Ethereum Staking');
      expect(mockOnChange).toHaveBeenCalledWith('Ethereum Staking');
    });

    it('should hide suggestions after clicking a suggestion', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={suggestions}
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      const suggestion = screen.getByText('Ethereum Staking');
      fireEvent.click(suggestion);
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should focus input after clicking a suggestion', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={suggestions}
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      const suggestion = screen.getByText('Ethereum Staking');
      fireEvent.click(suggestion);
      
      expect(input).toHaveFocus();
    });
  });

  describe('Keyboard Navigation', () => {
    const suggestions = ['Ethereum Staking', 'LayerZero Airdrop', 'Uniswap Quest'];

    it('should navigate suggestions with arrow keys', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={suggestions}
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      // Press ArrowDown
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      const firstOption = screen.getByRole('option', { name: /Ethereum Staking/i });
      expect(firstOption).toHaveAttribute('aria-selected', 'true');
      
      // Press ArrowDown again
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      const secondOption = screen.getByRole('option', { name: /LayerZero Airdrop/i });
      expect(secondOption).toHaveAttribute('aria-selected', 'true');
    });

    it('should navigate up with ArrowUp key', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={suggestions}
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      // Navigate down twice
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      // Navigate up
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      
      const firstOption = screen.getByRole('option', { name: /Ethereum Staking/i });
      expect(firstOption).toHaveAttribute('aria-selected', 'true');
    });

    it('should select suggestion with Enter key', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={suggestions}
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      // Navigate to first suggestion
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      // Select with Enter
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockOnChange).toHaveBeenCalledWith('Ethereum Staking');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should close suggestions with Escape key', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={suggestions}
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      fireEvent.keyDown(input, { key: 'Escape' });
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should clear search with Escape key when no suggestions', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={[]}
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      fireEvent.keyDown(input, { key: 'Escape' });
      
      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });

  describe('Click Outside', () => {
    it('should close suggestions when clicking outside', () => {
      render(
        <div>
          <SearchBar
            value=""
            onChange={mockOnChange}
            suggestions={['Ethereum Staking']}
          />
          <button>Outside</button>
        </div>
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      
      const outsideButton = screen.getByText('Outside');
      fireEvent.mouseDown(outsideButton);
      
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SearchBar value="" onChange={mockOnChange} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-label', 'Search opportunities');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when suggestions are shown', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={['Ethereum Staking']}
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(input).toHaveAttribute('aria-controls', 'search-suggestions');
    });

    it('should have proper role attributes on suggestions', () => {
      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
          suggestions={['Ethereum Staking', 'LayerZero Airdrop']}
        />
      );
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
    });
  });

  describe('Integration with useHunterFeed', () => {
    it('should work with useHunterFeed hook pattern', () => {
      const TestComponent = () => {
        const [search, setSearch] = React.useState('');
        
        return (
          <div>
            <SearchBar value={search} onChange={setSearch} />
            <div data-testid="search-value">{search}</div>
          </div>
        );
      };
      
      render(<TestComponent />);
      
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      // Advance timers to trigger debounced onChange
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      // Check that the value was updated
      expect(screen.getByTestId('search-value')).toHaveTextContent('test');
    });
  });
});
