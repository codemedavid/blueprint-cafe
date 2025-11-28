import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SiteSettings, SiteSetting } from '../types';

export const useSiteSettings = () => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSiteSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('id');

      if (error) throw error;

      // Transform the data into a more usable format
      const serviceChargeEnabledValue = data.find(s => s.id === 'service_charge_enabled')?.value || 'false';
      const serviceChargePercentageValue = data.find(s => s.id === 'service_charge_percentage')?.value || '7.5';
      const serviceChargeApplicableToValue = data.find(s => s.id === 'service_charge_applicable_to')?.value || '["dine-in", "delivery"]';
      
      let serviceChargeApplicableTo: string[] = [];
      try {
        serviceChargeApplicableTo = JSON.parse(serviceChargeApplicableToValue);
      } catch (e) {
        console.error('Error parsing service_charge_applicable_to:', e);
        serviceChargeApplicableTo = ['dine-in', 'delivery'];
      }

      const settings: SiteSettings = {
        site_name: data.find(s => s.id === 'site_name')?.value || 'Beracah Cafe',
        site_logo: data.find(s => s.id === 'site_logo')?.value || '',
        site_description: data.find(s => s.id === 'site_description')?.value || '',
        currency: data.find(s => s.id === 'currency')?.value || 'PHP',
        currency_code: data.find(s => s.id === 'currency_code')?.value || 'PHP',
        service_charge_enabled: serviceChargeEnabledValue === 'true',
        service_charge_percentage: parseFloat(serviceChargePercentageValue) || 7.5,
        service_charge_applicable_to: serviceChargeApplicableTo
      };

      setSiteSettings(settings);
    } catch (err) {
      console.error('Error fetching site settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch site settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSiteSetting = async (id: string, value: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('site_settings')
        .update({ value })
        .eq('id', id);

      if (error) throw error;

      // Refresh the settings
      await fetchSiteSettings();
    } catch (err) {
      console.error('Error updating site setting:', err);
      setError(err instanceof Error ? err.message : 'Failed to update site setting');
      throw err;
    }
  };

  const updateSiteSettings = async (updates: Partial<SiteSettings>) => {
    try {
      setError(null);

      const updatePromises = Object.entries(updates).map(([key, value]) => {
        // Convert value to string for storage
        let stringValue: string;
        if (key === 'service_charge_enabled') {
          stringValue = value ? 'true' : 'false';
        } else if (key === 'service_charge_percentage') {
          stringValue = String(value || 0);
        } else if (key === 'service_charge_applicable_to') {
          stringValue = JSON.stringify(value || []);
        } else {
          stringValue = String(value || '');
        }
        
        return supabase
          .from('site_settings')
          .update({ value: stringValue })
          .eq('id', key);
      });

      const results = await Promise.all(updatePromises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Some updates failed');
      }

      // Refresh the settings
      await fetchSiteSettings();
    } catch (err) {
      console.error('Error updating site settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update site settings');
      throw err;
    }
  };

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  return {
    siteSettings,
    loading,
    error,
    updateSiteSetting,
    updateSiteSettings,
    refetch: fetchSiteSettings
  };
};
