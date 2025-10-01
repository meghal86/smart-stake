'use client';

import { useState, useEffect } from 'react';

export function useActiveSection(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    // Load persisted active section
    const saved = localStorage.getItem('alpha/active-section');
    if (saved && sectionIds.includes(saved)) {
      setActiveSection(saved);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleSections.length > 0) {
          const mostVisible = visibleSections[0].target.id;
          setActiveSection(mostVisible);
          localStorage.setItem('alpha/active-section', mostVisible);
        }
      },
      {
        threshold: [0.1, 0.5, 0.9],
        rootMargin: '-88px 0px -50% 0px' // Account for header offset
      }
    );

    // Observe all sections
    sectionIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeSection;
}