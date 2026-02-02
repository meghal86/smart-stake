'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

/**
 * ThemeDemo Component
 * 
 * A demonstration component showing how the theme system works.
 * This can be used for testing or as a reference for developers.
 */
export function ThemeDemo() {
  const { theme, actualTheme, setTheme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Theme System Demo
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Current Theme: <span className="font-semibold">{theme}</span> 
          {' '}(Resolved: {actualTheme})
        </p>
      </div>

      {/* Theme Selector */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setTheme('light')}
          className={`p-6 rounded-xl border-2 transition-all ${
            theme === 'light'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <p className="font-medium text-slate-900 dark:text-white">Light</p>
        </button>

        <button
          onClick={() => setTheme('dark')}
          className={`p-6 rounded-xl border-2 transition-all ${
            theme === 'dark'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <Moon className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
          <p className="font-medium text-slate-900 dark:text-white">Dark</p>
        </button>

        <button
          onClick={() => setTheme('system')}
          className={`p-6 rounded-xl border-2 transition-all ${
            theme === 'system'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <Monitor className="w-8 h-8 mx-auto mb-2 text-slate-500" />
          <p className="font-medium text-slate-900 dark:text-white">System</p>
        </button>
      </div>

      {/* Color Palette Demo */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Color Palette
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Background */}
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
            <p className="text-sm text-slate-600 dark:text-slate-300">Background</p>
          </div>

          {/* Card */}
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <p className="text-sm text-slate-600 dark:text-slate-300">Card</p>
          </div>

          {/* Muted */}
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600" />
            <p className="text-sm text-slate-600 dark:text-slate-300">Muted</p>
          </div>

          {/* Accent */}
          <div className="space-y-2">
            <div className="h-20 rounded-lg bg-blue-500 dark:bg-blue-600" />
            <p className="text-sm text-slate-600 dark:text-slate-300">Accent</p>
          </div>
        </div>
      </div>

      {/* Text Examples */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Text Hierarchy
        </h2>
        
        <div className="space-y-2 p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            Primary Text (Heading)
          </p>
          <p className="text-lg text-slate-700 dark:text-slate-200">
            Secondary Text (Subheading)
          </p>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Body Text (Regular content)
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Muted Text (Helper text)
          </p>
        </div>
      </div>

      {/* Component Examples */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Component Examples
        </h2>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Primary Button
          </button>
          <button className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors">
            Secondary Button
          </button>
          <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white rounded-lg transition-colors">
            Outline Button
          </button>
        </div>

        {/* Card */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Card Component
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            This is an example card that adapts to the current theme. Notice how the background, text, and borders all change.
          </p>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              Tag 1
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
              Tag 2
            </span>
          </div>
        </div>

        {/* Input */}
        <input
          type="text"
          placeholder="Example input field"
          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Glass Morphism */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Glass Morphism
        </h2>
        
        <div className="relative h-40 rounded-xl overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600" />
          
          {/* Glass card */}
          <div className="absolute inset-4 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-lg p-6 flex items-center justify-center">
            <p className="text-white font-semibold text-lg">
              Glass Morphism Effect
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          💡 <strong>Tip:</strong> All these components automatically adapt to your theme preference. 
          Try switching between Light, Dark, and System modes to see the changes!
        </p>
      </div>
    </div>
  );
}
