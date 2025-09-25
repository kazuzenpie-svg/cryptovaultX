import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useAccessGrants } from './useAccessGrants';

export interface DataSourceVisibility {
  sourceId: string; // 'own' or grant.id
  sourceName: string;
  sourceType: 'own' | 'shared';
  isVisible: boolean;
  avatar_url?: string;
  username?: string;
}

export function useDataVisibility() {
  const { user } = useAuth();
  const { grants } = useAccessGrants();
  const [visibilitySettings, setVisibilitySettings] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preferences from localStorage
  useEffect(() => {
    if (user && !isLoaded) {
      const savedSettings = localStorage.getItem(`cryptovault_data_visibility_${user.id}`);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setVisibilitySettings(parsed);
        } catch (error) {
          console.error('Error parsing visibility settings:', error);
        }
      } else {
        // Default: show own data, hide shared data initially
        setVisibilitySettings({ own: true });
      }
      setIsLoaded(true);
    }
  }, [user, isLoaded]);

  // Save preferences when they change
  useEffect(() => {
    if (user && isLoaded && Object.keys(visibilitySettings).length > 0) {
      localStorage.setItem(
        `cryptovault_data_visibility_${user.id}`,
        JSON.stringify(visibilitySettings)
      );
    }
  }, [user, visibilitySettings, isLoaded]);

  // Create data sources list
  const dataSources: DataSourceVisibility[] = [
    // Own data source
    {
      sourceId: 'own',
      sourceName: 'My Data',
      sourceType: 'own',
      isVisible: visibilitySettings.own ?? true,
      username: user?.user_metadata?.username || user?.email?.split('@')[0] || 'You'
    },
    // Shared data sources from grants - ONLY where user is the VIEWER (recipient)
    ...grants
      .filter(grant => grant.viewer_id === user?.id) // Only show grants where user is the viewer
      .map(grant => ({
        sourceId: grant.id,
        sourceName: grant.sharer_profile?.username || 'Unknown User',
        sourceType: 'shared' as const,
        isVisible: visibilitySettings[grant.id] ?? false,
        avatar_url: grant.sharer_profile?.avatar_url,
        username: grant.sharer_profile?.username
      }))
  ];

  const toggleVisibility = (sourceId: string) => {
    setVisibilitySettings(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  };

  const isSourceVisible = (sourceId: string) => {
    return visibilitySettings[sourceId] ?? (sourceId === 'own');
  };

  const getVisibleSources = () => {
    return dataSources.filter(source => source.isVisible);
  };

  const getVisibleSourceIds = () => {
    return dataSources
      .filter(source => source.isVisible)
      .map(source => source.sourceId);
  };

  return {
    dataSources,
    visibilitySettings,
    toggleVisibility,
    isSourceVisible,
    getVisibleSources,
    getVisibleSourceIds,
    isLoaded
  };
}